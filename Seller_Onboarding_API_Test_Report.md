# Seller Onboarding Flow — E2E API Test Report

**Test Date:** 2026-02-28T11:03:30.273Z

## Setup

✅ Connected to MongoDB

- Test User: `69a2c73f1aba2b4eb5d1a7ed`
- Test Admin: `69a2c73f1aba2b4eb5d1a7f0`

## Test 0: Fetch Available Plans

✅ Picked plan: **Free Plan** (`69343a06f3cc0f148841bc94`)

## Test 1: Save Draft Application

✅ Draft created: `69a2cb823dcfbe18b7f3b838`
- Status: `draft`

## Test 2: Direct Submit with File Upload (VPS Pattern)

✅ Direct submit successful!
- Response keys: success, message, application
- Status: `submitted`
- addressProofImage: `uploads/sellers/1772276610757-162230171.png` ✅
- panImage: `uploads/sellers/1772276610758-728902833.png` ✅

## Test 3: Verify Files on VPS Disk

- uploads/sellers/1772276610757-162230171.png: ✅ EXISTS
- uploads/sellers/1772276610758-728902833.png: ✅ EXISTS

## Test 4: Verify Static File Serving

- GET /uploads/sellers/1772276610757-162230171.png: 200 ✅ (70 bytes)

## Test 5: Admin Fetches Application

✅ Admin can see application
- storeName: `VPS Test Store`
- addressProofImage: `uploads/sellers/1772276610757-162230171.png`
- panImage: `uploads/sellers/1772276610758-728902833.png`

## Test 6: Admin Requests Re-upload

✅ Re-upload requested
- Status: `reupload_requested`

## Test 7: Admin Suspends Seller


## ❌ TEST FAILED

**Error:** Request failed with status code 400
**Response:** `{"success":false,"message":"Can only suspend approved or active sellers"}`
**Stack:** AxiosError: Request failed with status code 400
    at settle (file:///Users/MyWork/GitHub/Companies/smitox/smitoxProduction/server/node_modules/axios/lib/core/settle.js:19:12)
    at IncomingMessage.handleStreamEnd (file:///Users/MyWork/GitHub/Companies/smitox/smitoxProduction/server/node_modules/axios/lib/adapters/http.js:617:11)
    at IncomingMessage.emit (node:events:520:35)
    at endReadableNT (node:internal/streams/readable:1701:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:89:21)
    at Axios.request (file:///Users/MyWork/GitHub/Companies/smitox/smitoxProduction/server/node_modules/axios/lib/core/Axios.js:45:41)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async runTests (file:///Users/MyWork/GitHub/Companies/smitox/smitoxProduction/server/testSellerFlow.mjs:213:25)

## Cleanup

- Deleted test application `69a2cb823dcfbe18b7f3b838`