import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  onSnapshot,
  arrayUnion,
  runTransaction
} from 'firebase/firestore';
import config from '../firebase-applet-config.json';

// Initialize Firebase using values from local config
const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const app = initializeApp(firebaseConfig);

// Set Auth with config
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Explicitly use the provisioned firestoreDatabaseId
const db = getFirestore(app, config.firestoreDatabaseId);

export { 
  app, 
  auth, 
  db, 
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  onSnapshot,
  arrayUnion,
  runTransaction,
  type User
};
