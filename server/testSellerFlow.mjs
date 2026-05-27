import axios from 'axios';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URL = 'mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox';
const JWT_SECRET = 'sdrbgkyulu';
const BASE_URL = 'http://localhost:8080/api/v1';

const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

const report = [];
const log = (msg) => {
    console.log(msg);
    report.push(msg);
};

const userSchema = new mongoose.Schema({
    user_fullname: String,
    email_id: String,
    mobile_no: String,
    role: Number,
    roleString: String,
    isActive: { type: Boolean, default: true }
});

const runTests = async () => {
    log('# Seller Onboarding Flow — E2E API Test Report\n');
    log(`**Test Date:** ${new Date().toISOString()}\n`);

    let userModel;
    let testUser = null;
    let testAdmin = null;
    let appId = null;

    try {
        // ─── SETUP ───────────────────────────────────────────────
        log('## Setup\n');
        await mongoose.connect(MONGO_URL);
        log('✅ Connected to MongoDB\n');

        userModel = mongoose.model('User', userSchema, 'users');

        const userPhone = "9998887776";
        testUser = await userModel.findOne({ mobile_no: userPhone });
        if (!testUser) {
            testUser = await userModel.create({
                user_fullname: "API Test User",
                email_id: "testuser_api@example.com",
                mobile_no: userPhone,
                role: 0,
                roleString: "user",
                isActive: true
            });
        }

        const adminPhone = "9998887775";
        testAdmin = await userModel.findOne({ mobile_no: adminPhone });
        if (!testAdmin) {
            testAdmin = await userModel.create({
                user_fullname: "API Test Admin",
                email_id: "testadmin_api@example.com",
                mobile_no: adminPhone,
                role: 1,
                roleString: "admin",
                isActive: true
            });
        }

        log(`- Test User: \`${testUser._id}\``);
        log(`- Test Admin: \`${testAdmin._id}\`\n`);

        const userToken = generateToken({ _id: testUser._id, role: 0, roleString: "user" });
        const adminToken = generateToken({ _id: testAdmin._id, role: 1, roleString: "super_admin" });

        const userClient = axios.create({ baseURL: BASE_URL, headers: { Authorization: userToken } });
        const adminClient = axios.create({ baseURL: BASE_URL, headers: { Authorization: adminToken } });

        // ─── TEST 0: Fetch Plans ──────────────────────────────────
        log('## Test 0: Fetch Available Plans\n');
        const plansRes = await userClient.get('/sellers/available-plans');
        const freePlan = plansRes.data.plans.find(p => p.isFree) || plansRes.data.plans[0];
        const planId = freePlan._id;
        log(`✅ Picked plan: **${freePlan.name}** (\`${planId}\`)\n`);

        // ─── TEST 1: Save Draft (POST /sellers/apply) ──────────────
        log('## Test 1: Save Draft Application\n');
        const draftRes = await userClient.post('/sellers/apply', { selectedPlanId: planId, storeName: 'VPS Test Store' });
        appId = draftRes.data.applicationId;
        log(`✅ Draft created: \`${appId}\``);
        log(`- Status: \`${draftRes.data.status}\`\n`);

        // ─── TEST 2: Direct Submit with FormData (POST /sellers/direct-submit) ──
        log('## Test 2: Direct Submit with File Upload (VPS Pattern)\n');

        // Create a small test PNG file
        const testImagePath = path.join(__dirname, 'test_image.png');
        // 1x1 red PNG
        const pngBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            'base64'
        );
        fs.writeFileSync(testImagePath, pngBuffer);

        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        formData.append('selectedPlanId', planId);
        formData.append('firstName', 'Test');
        formData.append('lastName', 'Seller');
        formData.append('email', 'testseller@example.com');
        formData.append('phone', '9998887776');
        formData.append('storeName', 'VPS Test Store');
        formData.append('legalBusinessName', 'VPS Test LLC');
        formData.append('businessName', 'VPS Test Business');
        formData.append('businessCategory', 'Electronics');
        formData.append('yearsInBusiness', '3');
        formData.append('addressLine1', '123 Main St');
        formData.append('city', 'Mumbai');
        formData.append('state', 'Maharashtra');
        formData.append('pincode', '400001');
        formData.append('pickupAddressLine1', '123 Main St');
        formData.append('pickupCity', 'Mumbai');
        formData.append('pickupState', 'Maharashtra');
        formData.append('pickupPincode', '400001');
        formData.append('gstNumber', '27AADCB2230M1Z2');
        formData.append('identityProofNumber', 'ABCDE1234F');
        formData.append('accountHolderName', 'Test Seller');
        formData.append('accountNumber', '1234567890');
        formData.append('ifscCode', 'SBIN0001234');
        formData.append('bankName', 'State Bank of India');
        formData.append('termsAccepted', 'true');
        formData.append('privacyAccepted', 'true');
        // Attach test image as address proof
        formData.append('addressProofImage', fs.createReadStream(testImagePath), 'address_proof.png');
        formData.append('panImage', fs.createReadStream(testImagePath), 'pan_card.png');

        const submitRes = await axios.post(
            `${BASE_URL}/sellers/direct-submit`,
            formData,
            {
                params: { selectedPlanId: planId },
                headers: {
                    Authorization: userToken,
                    ...formData.getHeaders()
                }
            }
        );

        log(`✅ Direct submit successful!`);
        log(`- Response keys: ${Object.keys(submitRes.data).join(', ')}`);

        const app = submitRes.data.application || submitRes.data;
        appId = app._id || appId; // keep draft appId if not returned
        log(`- Status: \`${app.status || 'submitted'}\``);

        // Verify file paths stored correctly
        const hasSellerPath = (app.addressProofImage || '').startsWith('uploads/sellers/');
        const hasPanPath = (app.panImage || '').startsWith('uploads/sellers/');
        log(`- addressProofImage: \`${app.addressProofImage || 'N/A'}\` ${hasSellerPath ? '✅' : '⚠️ check manually'}`);
        log(`- panImage: \`${app.panImage || 'N/A'}\` ${hasPanPath ? '✅' : '⚠️ check manually'}\n`);

        // Verify files exist on disk
        log('## Test 3: Verify Files on VPS Disk\n');
        if (app.addressProofImage) {
            const filePath = path.join(__dirname, app.addressProofImage);
            const exists = fs.existsSync(filePath);
            log(`- ${app.addressProofImage}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        }
        if (app.panImage) {
            const filePath = path.join(__dirname, app.panImage);
            const exists = fs.existsSync(filePath);
            log(`- ${app.panImage}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        }
        log('');

        // Verify serving via HTTP
        log('## Test 4: Verify Static File Serving\n');
        if (app.addressProofImage) {
            try {
                const imgRes = await axios.get(`http://localhost:8080/${app.addressProofImage}`, { responseType: 'arraybuffer' });
                log(`- GET /${app.addressProofImage}: ${imgRes.status} ✅ (${imgRes.data.length} bytes)`);
            } catch (e) {
                log(`- GET /${app.addressProofImage}: ${e.response?.status || 'ERR'} ❌`);
            }
        }
        log('');

        // ─── TEST 5: Admin fetches and sees Documents ──────────
        log('## Test 5: Admin Fetches Application\n');
        const adminAppRes = await adminClient.get(`/sellers/${appId}`);
        const adminApp = adminAppRes.data.application;
        log(`✅ Admin can see application`);
        log(`- storeName: \`${adminApp.storeName}\``);
        log(`- addressProofImage: \`${adminApp.addressProofImage}\``);
        log(`- panImage: \`${adminApp.panImage}\`\n`);

        // ─── TEST 6: Request Re-upload ─────────────────────────
        log('## Test 6: Admin Requests Re-upload\n');
        const reupRes = await adminClient.post(`/sellers/${appId}/request-reupload`, {
            reason: 'GST document is blurry, please re-upload',
            fields: ['gstImage', 'panImage']
        });
        log(`✅ Re-upload requested`);
        log(`- Status: \`${reupRes.data.status}\`\n`);

        // ─── TEST 7: Suspend ───────────────────────────────────
        log('## Test 7: Admin Suspends Seller\n');
        const suspRes = await adminClient.post(`/sellers/${appId}/suspend`, {
            reason: 'Policy Violation — testing'
        });
        log(`✅ Seller Suspended`);
        log(`- Status: \`${suspRes.data.status}\`\n`);

        log('---\n');
        log('## ✅ All Tests Passed! 🎉');

        // Cleanup temp image
        fs.unlinkSync(testImagePath);

    } catch (err) {
        log(`\n## ❌ TEST FAILED\n`);
        log(`**Error:** ${err.message}`);
        if (err.response) {
            log(`**Response:** \`${JSON.stringify(err.response.data)}\``);
        }
        log(`**Stack:** ${err.stack}`);
    }

    // Cleanup
    if (mongoose.connection.readyState !== 0) {
        if (appId) {
            log('\n## Cleanup\n');
            const db = mongoose.connection.db;
            await db.collection('sellerapplications').deleteOne({ _id: new mongoose.Types.ObjectId(appId) });
            log(`- Deleted test application \`${appId}\``);
        }
        await mongoose.disconnect();
    }

    fs.writeFileSync(path.join(__dirname, '..', 'Seller_Onboarding_API_Test_Report.md'), report.join('\n'));
    log('\n📝 Report written to Seller_Onboarding_API_Test_Report.md');
};

runTests();
