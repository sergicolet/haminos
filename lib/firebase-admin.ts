import * as admin from 'firebase-admin';

function getAdminApp() {
  if (admin.apps.length) return admin.apps[0]!;
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = () => admin.firestore(getAdminApp());
export const adminAuth = () => admin.auth(getAdminApp());
