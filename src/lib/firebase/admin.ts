import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let serviceAccount: any = null;

const serviceAccountPath = path.join(process.cwd(), 'src', 'lib', 'firebase', 'serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  try {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } catch (e) {
    console.error('Error reading serviceAccountKey.json', e);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (e) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY environment variable', e);
  }
}

if (!admin.apps.length && serviceAccount && serviceAccount.private_key && !serviceAccount.private_key.includes('YOUR_PRIVATE_KEY')) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || 'student-marketplace-badb0',
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const db = admin.apps.length ? admin.firestore() : (null as any);
export const auth = admin.apps.length ? admin.auth() : (null as any);
export default admin;
