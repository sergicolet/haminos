import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  type Auth,
  type User
} from "firebase/auth";
import {
  getFirestore,
  collection, query, where, getDocs, orderBy, limit,
  onSnapshot, addDoc, updateDoc, doc, serverTimestamp,
  deleteDoc, Timestamp,
  type Firestore
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Only initialize Firebase on the client side
let app: FirebaseApp
let auth: Auth
let db: Firestore
let googleProvider: GoogleAuthProvider

if (typeof window !== 'undefined') {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
  auth = getAuth(app)
  db = getFirestore(app)
  googleProvider = new GoogleAuthProvider()
} else {
  // Server-side stubs — never actually called at runtime (only during static generation)
  app = {} as FirebaseApp
  auth = {} as Auth
  db = {} as Firestore
  googleProvider = {} as GoogleAuthProvider
}

export type { User };
export {
  app,
  auth,
  db,
  googleProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  collection, query, where, getDocs, orderBy, limit, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp, deleteDoc, Timestamp
};
