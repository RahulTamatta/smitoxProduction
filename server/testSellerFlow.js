import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const JWT_SECRET = 'sdrbgkyulu';
const BASE_URL = 'http://localhost:8080/api/v1';

const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

// Mock IDs
const userId = "64f1b2c3d4e5f6a7b8c9d0e1";
const adminId = "64f1b2c3d4e5f6a7b8c9d0e2";

// Generate tokens
const userToken = generateToken({ _id: userId, role: 0, roleString: "user" });
const adminToken = generateToken({ _id: adminId, role: 1, roleString: "admin" });

const userClient = axios.create({ baseURL: BASE_URL, headers: { Authorization: userToken } });
const adminClient = axios.create({ baseURL: BASE_URL, headers: { Authorization: adminToken } });

const report = [];
const log = (msg) => {
  console.log(msg);
  report.push(msg);
};

const runTests = async () => {
  log('# Seller Onboarding Flow - API Test Report\n');
  log(`*Test Date: ${new Date().toISOString()}*\n`);
  
  let appId = null;
  
  try {
    log('## 1. User Applies for Seller Account (`POST /seller-applications/apply`)');
    const applyRes = await userClient.post('/seller-applications/apply', { selectedPlan: 'free' });
    appId = applyRes.data.application._id;
    log(`✅ Success. Created application: \`${appId}\``);
    log(`- Status: \`${applyRes.data.application.status}\`\n`);
    
    log('## 2. User Saves Draft (`PUT /seller-applications/draft`)');
    const draftRes = await userClient.put('/seller-applications/draft', { storeName: 'Test Store' });
    log(`✅ Success. Updated storeName to: \`${draftRes.data.application.storeName}\`\n`);

    log('## 3. User Submits Application (`PUT /seller-applications/submit`)');
    const submitData = {
      storeName: 'Test Store',
      legalBusinessName: 'Test Business LLC',
      businessCategory: 'Electronics',
      yearsInBusiness: '2',
      gstNumber: '27AADCB2230M1Z2',
      accountName: 'John Doe',
      accountNumber: '1234567890',
      ifscCode: 'SBIN0001234',
      addressLine1: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      agreedToTerms: true
    };
    
    const submitRes = await userClient.put('/seller-applications/submit', submitData);
    log(`✅ Success. Application Submitted.`);
    log(`- Status: \`${submitRes.data.application.status}\`\n`);

    log('## 4. Admin Gets All Applications (`GET /seller-applications/all`)');
    const allRes = await adminClient.get('/seller-applications/all');
    log(`✅ Success. Found ${allRes.data.applications.length} applications.\n`);

    log('## 5. Admin Requests Re-upload (`POST /seller-applications/:id/request-reupload`)');
    const reuploadRes = await adminClient.post(`/seller-applications/${appId}/request-reupload`, {
      reuploadReason: 'GST Document is blurry',
      reuploadRequestedFields: ['gstImage']
    });
    log(`✅ Success. Requested Re-upload.`);
    log(`- Status: \`${reuploadRes.data.application.status}\`\n`);

    log('## 6. User Fetches Application (`GET /seller-applications/my-application`)');
    const myAppRes = await userClient.get('/seller-applications/my-application');
    log(`✅ Success. User sees status: \`${myAppRes.data.application.status}\` with fields: ${myAppRes.data.application.reuploadRequestedFields.join(',')}\n`);

    log('## 7. User Resubmits Application (`PUT /seller-applications/submit`)');
    const resubmitRes = await userClient.put('/seller-applications/submit', submitData);
    log(`✅ Success. Application Resubmitted.`);
    log(`- Status: \`${resubmitRes.data.application.status}\`\n`);

    log('## 8. Admin Approves Application (`PUT /seller-applications/:id/approve`)');
    // Using simple approve without files for api test
    const approveRes = await adminClient.put(`/seller-applications/${appId}/approve`);
    log(`✅ Success. Application Approved.`);
    log(`- Status: \`${approveRes.data.application.status}\`\n`);

    log('## 9. Admin Suspends Seller (`POST /seller-applications/:id/suspend`)');
    const suspendRes = await adminClient.post(`/seller-applications/${appId}/suspend`, {
      suspendedReason: 'Policy Violation Testing'
    });
    log(`✅ Success. Seller Suspended.`);
    log(`- Status: \`${suspendRes.data.application.status}\`\n`);

    log('### Test Suite Completed Successfully! 🎉');
    
  } catch (err) {
    log(`\n❌ **TEST FAILED**`);
    log(`Error: ${err.message}`);
    if (err.response) {
      log(`Response: ${JSON.stringify(err.response.data)}`);
    }
  }

  // Write report to markdown file in project root
  fs.writeFileSync('../Seller_Onboarding_API_Test_Report.md', report.join('\n'));
};

runTests();
