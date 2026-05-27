import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import userModel from '../models/userModel.js';

// Load environment variables
dotenv.config();

/**
 * Payment Reconciliation Script
 * Finds Razorpay payments that don't have corresponding orders in the database
 * and generates a report for manual verification and order creation
 */

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Enrich order products with snapshot data
 */
async function enrichOrderProducts(products) {
    const enrichedProducts = await Promise.all(
        products.map(async (item) => {
            try {
                const product = await productModel.findById(item.product);
                if (!product) {
                    console.error(`Product not found: ${item.product}`);
                    return item;
                }

                const unitPrice = parseFloat(product.perPiecePrice) || 0;
                const quantity = parseInt(item.quantity) || 0;
                const netAmount = unitPrice * quantity;
                const gst = parseFloat(product.gst) || 0;
                const taxAmount = (netAmount * gst) / 100;
                const totalAmount = netAmount + taxAmount;

                return {
                    ...item,
                    unitPrice,
                    netAmount,
                    taxAmount,
                    totalAmount,
                    gst,
                    productName: product.name,
                    productImage: product.photos || "",
                    unitSet: product.unitSet || 1,
                };
            } catch (error) {
                console.error(`Error enriching product ${item.product}:`, error);
                return item;
            }
        })
    );
    return enrichedProducts;
}

/**
 * Fetch Razorpay payments within a date range
 */
async function fetchRazorpayPayments(fromDate, toDate) {
    console.log(`\nFetching Razorpay payments from ${fromDate} to ${toDate}...`);

    const from = Math.floor(new Date(fromDate).getTime() / 1000);
    const to = Math.floor(new Date(toDate).getTime() / 1000);

    const payments = [];
    let skip = 0;
    const count = 100; // Razorpay limit per request

    try {
        while (true) {
            const response = await razorpay.payments.all({
                from,
                to,
                count,
                skip
            });

            if (!response.items || response.items.length === 0) {
                break;
            }

            payments.push(...response.items);
            skip += count;

            console.log(`  Fetched ${payments.length} payments...`);

            // Stop if we've fetched all available payments
            if (response.items.length < count) {
                break;
            }
        }

        console.log(`✓ Total payments fetched: ${payments.length}\n`);
        return payments;
    } catch (error) {
        console.error('Error fetching Razorpay payments:', error);
        throw error;
    }
}

/**
 * Check if an order exists for a payment
 */
async function findOrderForPayment(payment) {
    const order = await orderModel.findOne({
        $or: [
            { 'payment.transactionId': payment.order_id },
            { 'payment.razorpayPaymentId': payment.id }
        ]
    });
    return order;
}

/**
 * Get user details by phone number
 */
async function findUserByPhone(phone) {
    // Remove country code and spaces for flexible matching
    const cleanPhone = phone.replace(/[\s\+\-]/g, '');
    const user = await userModel.findOne({
        phone: new RegExp(cleanPhone.slice(-10), 'i') // Match last 10 digits
    });
    return user;
}

/**
 * Fetch order details from Razorpay
 */
async function fetchRazorpayOrder(orderId) {
    try {
        const order = await razorpay.orders.fetch(orderId);
        return order;
    } catch (error) {
        console.error(`Error fetching Razorpay order ${orderId}:`, error.message);
        return null;
    }
}

/**
 * Create order from failed payment log
 */
async function createOrderFromFailedLog(log) {
    try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Processing failed payment: ${log.payment_id}`);
        console.log(`${'='.repeat(60)}`);

        // Check if order already exists  
        const existingOrder = await orderModel.findOne({
            $or: [
                { 'payment.transactionId': log.order_id },
                { 'payment.razorpayPaymentId': log.payment_id }
            ]
        });

        if (existingOrder) {
            console.log(`✅ Order already exists: ${existingOrder._id}`);
            log.resolved = true;
            log.resolvedAt = new Date();
            log.resolvedBy = 'auto-reconciliation';
            log.resolvedNote = `Order found: ${existingOrder._id}`;
            await log.save();
            return { success: true, orderId: existingOrder._id, action: 'found' };
        }

        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(log.payment_id);

        if (payment.status !== 'captured') {
            console.log(`⚠️ Payment not captured, status: ${payment.status}`);
            log.resolved = true;
            log.resolvedAt = new Date();
            log.resolvedBy = 'auto-reconciliation';
            log.resolvedNote = `Payment not captured, status: ${payment.status}`;
            await log.save();
            return { success: true, action: 'skipped', reason: 'not_captured' };
        }

        // Fetch Razorpay order
        const razorpayOrder = await fetchRazorpayOrder(log.order_id);

        if (!razorpayOrder || !razorpayOrder.notes || !razorpayOrder.notes.products) {
            // Try using products from log
            if (!log.products) {
                console.log('⚠️ Cannot create order: Missing product data');
                log.attemptCount += 1;
                log.lastAttemptAt = new Date();
                await log.save();
                return { success: false, reason: 'Missing product data' };
            }
        }

        const products = log.products || JSON.parse(razorpayOrder.notes.products);
        const userId = log.userId || razorpayOrder.notes.userId;

        console.log(`User ID: ${userId}`);
        console.log(`Products: ${products.length} items`);
        console.log(`Amount: ₹${log.amount}`);

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Enrich products
            const enrichedProducts = await enrichOrderProducts(products);

            // Create order
            const order = new orderModel({
                products: enrichedProducts,
                payment: {
                    paymentMethod: "Razorpay",
                    transactionId: log.order_id,
                    razorpayPaymentId: log.payment_id,
                    status: true,
                },
                buyer: userId,
                amount: razorpayOrder?.notes?.baseAmount ? parseFloat(razorpayOrder.notes.baseAmount) : log.amount,
                amountPending: razorpayOrder?.notes?.amountPending ? parseFloat(razorpayOrder.notes.amountPending) : 0,
                status: "Pending",
            });

            await order.save({ session });
            console.log(`✓ Order created: ${order._id}`);

            // Update stock
            for (const item of products) {
                await productModel.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: -item.quantity } },
                    { new: true, session }
                );
            }

            await session.commitTransaction();
            session.endSession();

            // Mark as resolved
            log.resolved = true;
            log.resolvedAt = new Date();
            log.resolvedBy = 'auto-reconciliation';
            log.resolvedNote = `Order created: ${order._id}`;
            await log.save();

            console.log(`✅ Order created successfully: ${order._id}`);
            return { success: true, orderId: order._id, action: 'created' };

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error(`❌ Failed to create order:`, error.message);

            log.attemptCount += 1;
            log.lastAttemptAt = new Date();
            await log.save();

            return { success: false, reason: error.message };
        }

    } catch (error) {
        console.error(`Error in createOrderFromFailedLog:`, error);
        log.attemptCount += 1;
        log.lastAttemptAt = new Date();
        await log.save();
        return { success: false, reason: error.message };
    }
}

/**
 * Main reconciliation function
 */
async function reconcilePayments(options = {}) {
    const {
        fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        toDate = new Date(),
        phoneNumber = null,
        autoCreate = false,
        failedLogsOnly = false  // NEW: Only process failed payment logs
    } = options;

    try {
        // Connect to MongoDB
        console.log('\n🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✓ Connected to MongoDB\n');

        // NEW: Process failed payment logs first
        if (failedLogsOnly || autoCreate) {
            console.log('\n📋 Processing failed payment logs from database...\n');

            const failedLogs = await FailedPaymentLog.find({ resolved: false })
                .sort({ timestamp: 1 })
                .limit(50);

            console.log(`Found ${failedLogs.length} unresolved failed payments\n`);

            if (failedLogs.length > 0) {
                const failedResults = [];

                for (const log of failedLogs) {
                    const result = await createOrderFromFailedLog(log);
                    failedResults.push({ log, result });

                    // Small delay to avoid overwhelming APIs
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                const created = failedResults.filter(r => r.result.success && r.result.action === 'created').length;
                const found = failedResults.filter(r => r.result.success && r.result.action === 'found').length;
                const skipped = failedResults.filter(r => r.result.success && r.result.action === 'skipped').length;
                const failed = failedResults.filter(r => !r.result.success).length;

                console.log('\n' + '='.repeat(80));
                console.log('FAILED PAYMENT LOGS RECONCILIATION');
                console.log('='.repeat(80));
                console.log(`Total processed:        ${failedResults.length}`);
                console.log(`Orders created:         ${created}`);
                console.log(`Orders already existed: ${found}`);
                console.log(`Payments skipped:       ${skipped}`);
                console.log(`Still failed:           ${failed}`);
                console.log('='.repeat(80) + '\n');
            }

            if (failedLogsOnly) {
                await mongoose.connection.close();
                console.log('✓ MongoDB connection closed\n');
                return;
            }
        }

        // Fetch payments from Razorpay
        const payments = await fetchRazorpayPayments(fromDate, toDate);

        // Filter for captured/authorized payments only
        const successfulPayments = payments.filter(p =>
            p.status === 'captured' || p.status === 'authorized'
        );

        console.log(`Checking ${successfulPayments.length} successful payments for missing orders...\n`);

        const missingOrders = [];
        const foundOrders = [];

        for (const payment of successfulPayments) {
            // Skip if phone filter is set and doesn't match
            if (phoneNumber && !payment.contact?.includes(phoneNumber.replace(/[\s\+\-]/g, ''))) {
                continue;
            }

            const existingOrder = await findOrderForPayment(payment);

            if (!existingOrder) {
                const razorpayOrder = await fetchRazorpayOrder(payment.order_id);
                const user = payment.contact ? await findUserByPhone(payment.contact) : null;

                missingOrders.push({
                    paymentId: payment.id,
                    orderId: payment.order_id,
                    amount: payment.amount / 100,
                    contact: payment.contact,
                    email: payment.email,
                    userId: user?._id,
                    userName: user?.name,
                    createdAt: new Date(payment.created_at * 1000),
                    notes: razorpayOrder?.notes,
                    hasProductData: !!(razorpayOrder?.notes?.products)
                });
            } else {
                foundOrders.push(payment.id);
            }
        }

        // Generate Report
        console.log('\n' + '='.repeat(80));
        console.log('RECONCILIATION REPORT');
        console.log('='.repeat(80));
        console.log(`\nDate Range: ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`);
        console.log(`Total Successful Payments: ${successfulPayments.length}`);
        console.log(`Orders Found: ${foundOrders.length}`);
        console.log(`Missing Orders: ${missingOrders.length}\n`);

        if (missingOrders.length > 0) {
            console.log('MISSING ORDERS DETAILS:');
            console.log('-'.repeat(80));

            missingOrders.forEach((order, index) => {
                console.log(`\n${index + 1}. Payment ID: ${order.paymentId}`);
                console.log(`   Order ID: ${order.orderId}`);
                console.log(`   Amount: ₹${order.amount}`);
                console.log(`   Phone: ${order.contact || 'N/A'}`);
                console.log(`   Email: ${order.email || 'N/A'}`);
                console.log(`   User: ${order.userName || 'Unknown'} (${order.userId || 'N/A'})`);
                console.log(`   Date: ${order.createdAt.toLocaleString()}`);
                console.log(`   Has Product Data: ${order.hasProductData ? '✓ Yes' : '✗ No'}`);
            });

            console.log('\n' + '='.repeat(80));

            // Auto-create orders if enabled
            if (autoCreate) {
                console.log('\n🔧 AUTO-CREATE MODE ENABLED - Creating missing orders...\n');
                const results = [];

                for (const missing of missingOrders) {
                    const razorpayOrder = await fetchRazorpayOrder(missing.orderId);
                    const payment = successfulPayments.find(p => p.id === missing.paymentId);

                    const result = await createMissingOrder(payment, razorpayOrder, true);
                    results.push({ ...missing, createResult: result });
                }

                const created = results.filter(r => r.createResult.success).length;
                const failed = results.filter(r => !r.createResult.success).length;

                console.log(`\n📊 CREATION SUMMARY:`);
                console.log(`   ✅ Successfully created: ${created}`);
                console.log(`   ❌ Failed: ${failed}`);
            } else {
                console.log('\n💡 TIP: Run with --auto-create flag to automatically create missing orders');
                console.log('   Example: node scripts/reconcilePayments.js --auto-create\n');
            }
        } else {
            console.log('✅ All payments have corresponding orders!\n');
        }

        await mongoose.connection.close();
        console.log('✓ MongoDB connection closed\n');

    } catch (error) {
        console.error('❌ Reconciliation failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--from' && args[i + 1]) {
            options.fromDate = new Date(args[i + 1]);
            i++;
        } else if (args[i] === '--to' && args[i + 1]) {
            options.toDate = new Date(args[i + 1]);
            i++;
        } else if (args[i] === '--phone' && args[i + 1]) {
            options.phoneNumber = args[i + 1];
            i++;
        } else if (args[i] === '--auto-create') {
            options.autoCreate = true;
        }
    }

    reconcilePayments(options);
}

export default reconcilePayments;
