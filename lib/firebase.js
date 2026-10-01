// lib/firebase.js
// Firebase Admin setup using the modern modular API (v11+).
// - Locally: reads firebase-service-account.json from the project root.
// - On Render: reads the whole JSON from the FIREBASE_SERVICE_ACCOUNT env var.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');
const fs = require('fs');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Production: whole JSON file stored as one environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Local: read from the downloaded JSON file
  const keyPath = path.join(__dirname, '..', 'firebase-service-account.json');
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      'firebase-service-account.json not found in the project root.\n' +
      'Download it from Firebase Console → Project settings → Service accounts → Generate new private key.'
    );
  }
  serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

// Sanity checks with helpful messages
if (!serviceAccount.project_id) {
  throw new Error('Service account JSON is missing "project_id". Re-download it.');
}
if (!serviceAccount.client_email) {
  throw new Error('Service account JSON is missing "client_email". Re-download it.');
}
if (!serviceAccount.private_key) {
  throw new Error('Service account JSON is missing "private_key". Re-download it.');
}

// Avoid "already initialized" errors if the module is required twice
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();
const auth = getAuth();

module.exports = { db, auth };