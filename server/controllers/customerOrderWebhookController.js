import crypto from "crypto";
import mongoose from "mongoose";
import { ROLES } from "../config/rbac-policy.js";
import { logAuditEvent } from "../middlewares/rbacMiddleware.js";
import FailedPaymentLog from "../models/FailedPaymentLog.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";

/**
 * Enrich order products with snapshot data
 * (Copied from productController.js to avoid circular dependency)
 */
async function enrichOrderProducts(products) {
    const enrichedProducts = await Promise.all(
        products.map(async (item) => {
            try {
                const product = await productModel.findById(item.product);
                if (!product) {
                    console.error(`[Enrich] Product not found: ${item.product}`);
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
                console.error(`[Enrich] Error enriching product ${item.product}:`, error);
                return item;
            }
        })
    );
    return enrichedProducts;
}

/**
 * Handle Razorpay payment webhook for customer orders
 * Triggered by Razorpay when payment.captured event occurs
 */
export const handleCustomerOrderWebhook = async (req, res) => {
    try {
        console.log(`[Webhook] Customer order webhook received | Event: ${req.body.event}`);

        // Validate webhook signature (MANDATORY for security)
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // Ensure webhook secret is configured
        if (!webhookSecret) {
            console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET not configured! Webhook processing disabled for security.');
            return res.status(500).json({
                success: false,
                message: 'Webhook secret not configured. Please contact system administrator.'
            });
        }

        const signature = req.headers['x-razorpay-signature'];

        // Ensure signature is present
        if (!signature) {
            console.error('[Webhook] Missing x-razorpay-signature header');
            return res.status(400).json({
                success: false,
                message: 'Missing webhook signature'
            });
        }

        // Verify signature
        const body = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('[Webhook] Invalid webhook signature | Expected: ${expectedSignature.substring(0, 10)}... | Received: ${signature.substring(0, 10)}...');
            return res.status(400).json({
                success: false,
                message: 'Invalid webhook signature'
            });
        }

        console.log('[Webhook] Signature verified successfully');

        const { event, payload } = req.body;

        // Only process payment.captured events
        if (event !== 'payment.captured') {
            console.log(`[Webhook] Ignoring event: ${event}`);
            return res.status(200).json({ success: true, message: 'Event ignored' });
        }

        const payment = payload.payment.entity;
        const { order_id, id: payment_id, amount, contact, email, status } = payment;

        console.log(`[Webhook] Processing payment | Order ID: ${order_id} | Payment ID: ${payment_id} | Amount: ${amount / 100}`);

        // Check if order already exists for this payment
        const existingOrder = await orderModel.findOne({
            $or: [
                { 'payment.transactionId': order_id },
                { 'payment.razorpayPaymentId': payment_id }
            ]
        });

        if (existingOrder) {
            console.log(`[Webhook] Order already exists | Order ID: ${existingOrder._id}`);
            return res.status(200).json({
                success: true,
                message: 'Order already exists',
                orderId: existingOrder._id
            });
        }

        // Fetch Razorpay order to get notes with product data
        let razorpayOrder;
        try {
            const Razorpay = (await import('razorpay')).default;
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
            });

            // Add timeout wrapper to prevent infinite hangs
            const fetchPromise = razorpay.orders.fetch(order_id);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error("Razorpay API timeout in webhook - order fetch took longer than 30 seconds"));
                }, 30000); // 30 second timeout
            });

            razorpayOrder = await Promise.race([fetchPromise, timeoutPromise]);
            console.log(`[Webhook] Razorpay order fetched | Status: ${razorpayOrder.status}`);
        } catch (fetchError) {
            console.error(`[Webhook] Failed to fetch Razorpay order:`, fetchError);

            // Log for reconciliation in database
            try {
                await FailedPaymentLog.create({
                    order_id,
                    payment_id,
                    amount: amount / 100,
                    contact,
                    email,
                    error: 'Failed to fetch Razorpay order details',
                    errorMessage: fetchError.message,
                    errorStack: fetchError.stack
                });
            } catch (logError) {
                console.error(`[Webhook] Failed to log payment failure:`, logError);
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to fetch order details',
                error: fetchError.message
            });
        }

        // Parse products from notes
        let products;
        try {
            products = JSON.parse(razorpayOrder.notes.products);
            console.log(`[Webhook] Parsed products | Count: ${products.length}`);
        } catch (parseError) {
            console.error(`[Webhook] Failed to parse products from notes:`, parseError);

            try {
                await FailedPaymentLog.create({
                    order_id,
                    payment_id,
                    amount: amount / 100,
                    contact,
                    email,
                    error: 'Failed to parse products data',
                    errorMessage: parseError.message,
                    errorStack: parseError.stack
                });
            } catch (logError) {
                console.error(`[Webhook] Failed to log payment failure:`, logError);
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to parse order product data'
            });
        }

        // Start transaction for order creation
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Enrich products with snapshot data
            const enrichedProducts = await enrichOrderProducts(products);
            console.log(`[Webhook] Products enriched | Count: ${enrichedProducts.length}`);

            // Create order
            const order = new orderModel({
                products: enrichedProducts,
                payment: {
                    paymentMethod: "Razorpay",
                    transactionId: order_id,
                    razorpayPaymentId: payment_id,
                    status: true,
                },
                buyer: razorpayOrder.notes.userId,
                amount: parseFloat(razorpayOrder.notes.baseAmount),
                amountPending: parseFloat(razorpayOrder.notes.amountPending) || 0,
                status: "Pending",
            });

            await order.save({ session });
            console.log(`[Webhook] Order created | Order ID: ${order._id}`);

            // Update stock for each product
            for (const item of products) {
                const updatedProduct = await productModel.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: -item.quantity } },
                    { new: true, session }
                );

                if (!updatedProduct) {
                    throw new Error(`Product with ID ${item.product} not found`);
                }

                console.log(`[Webhook] Stock updated | Product: ${updatedProduct.name} | New stock: ${updatedProduct.stock}`);
            }

            // Commit transaction
            await session.commitTransaction();
            console.log(`[Webhook] Transaction committed successfully`);
            session.endSession();

            // Log audit event
            await logAuditEvent({
                actor: razorpayOrder.notes.userId,
                actorRole: ROLES.USER,
                action: "order_created_via_webhook",
                resourceType: "order",
                resourceId: order._id,
                severity: "medium",
                description: `Order created via payment webhook | Amount: ₹${amount / 100} | Phone: ${contact}`,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
            });

            res.status(200).json({
                success: true,
                message: 'Order created successfully via webhook',
                orderId: order._id
            });

        } catch (transactionError) {
            console.error(`[Webhook] Transaction failed:`, transactionError);

            // Abort transaction
            if (session) {
                await session.abortTransaction();
                session.endSession();
            }

            // Log for reconciliation in database
            try {
                await FailedPaymentLog.create({
                    order_id,
                    payment_id,
                    amount: amount / 100,
                    contact,
                    email,
                    userId: razorpayOrder.notes.userId,
                    error: 'Transaction failed during order creation',
                    errorMessage: transactionError.message,
                    errorStack: transactionError.stack,
                    products
                });
            } catch (logError) {
                console.error(`[Webhook] Failed to log payment failure:`, logError);
            }

            res.status(500).json({
                success: false,
                message: 'Failed to create order',
                error: transactionError.message
            });
        }

    } catch (error) {
        console.error(`[Webhook] Unhandled error in customer order webhook:`, error);
        res.status(500).json({
            success: false,
            message: 'Error processing webhook',
            error: error.message
        });
    }
};

/**
 * Get failed payment logs for reconciliation
 * Query parameters:
 *   - resolved: filter by resolved status (true/false)
 *   - limit: number of results (default 100)
 *   - skip: pagination offset (default 0)
 */
export const getFailedPaymentLogs = async (req, res) => {
    try {
        const { resolved, limit = 100, skip = 0 } = req.query;

        const query = {};
        if (resolved !== undefined) {
            query.resolved = resolved === 'true';
        }

        const logs = await FailedPaymentLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const count = await FailedPaymentLog.countDocuments(query);

        res.status(200).json({
            success: true,
            count,
            total: count,
            logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching failed payment logs',
            error: error.message
        });
    }
};

export default {
    handleCustomerOrderWebhook,
    getFailedPaymentLogs,
};
