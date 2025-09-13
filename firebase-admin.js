const admin = require('firebase-admin');
// Expect FIREBASE_SERVICE_ACCOUNT_JSON env var containing JSON string
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set - Firebase admin not initialized');
  module.exports = null;
} else {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    module.exports = admin;
  } catch (err) {
    console.error('Failed to init firebase-admin:', err);
    module.exports = null;
  }
}
