/**
 * Webhook Routes
 * Routes for handling payment provider webhooks
 */

import express from 'express';
import { handleRazorpayWebhook } from '../webhooks/razorpayWebhook.js';

const router = express.Router();

/**
 * Middleware to capture raw body for signature verification
 */
const captureRawBody = (req, res, next) => {
    let data = '';
    req.setEncoding('utf8');

    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', () => {
        req.rawBody = data;
        try {
            req.body = JSON.parse(data);
        } catch (e) {
            req.body = {};
        }
        next();
    });
};

/**
 * @route POST /webhooks/razorpay
 * @desc Handle Razorpay payment webhooks
 * @access Public (verified by signature)
 */
router.post('/razorpay', captureRawBody, handleRazorpayWebhook);

export default router;
