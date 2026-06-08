import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isFirebaseInitialized = false;

export const initializeFirebase = () => {
  try {
    if (!isFirebaseInitialized) {
      // Look for service account in the root of the server directory
      const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
      
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        isFirebaseInitialized = true;
        console.log('Firebase Admin initialized successfully.');
      } else {
        console.warn('Firebase serviceAccountKey.json not found. Push notifications will be disabled.');
      }
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
};

/**
 * Send a push notification to a specific FCM token
 * @param {string} token - The FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional custom data payload (string key-value pairs)
 */
export const sendPushNotification = async (token, title, body, data = {}) => {
  if (!isFirebaseInitialized || !token) {
    return false;
  }

  const message = {
    notification: {
      title,
      body
    },
    data,
    token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};
