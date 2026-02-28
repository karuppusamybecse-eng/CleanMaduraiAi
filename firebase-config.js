import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

// TODO: Replace with your actual Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB0wAIFwvFjlbnwotEAVujSVTxzDDWyRX4",
  authDomain: "cleanmadurai-ai-f265d.firebaseapp.com",
  projectId: "cleanmadurai-ai-f265d",
  storageBucket: "cleanmadurai-ai-f265d.firebasestorage.app",
  messagingSenderId: "480307013300",
  appId: "1:480307013300:web:0dd09179b1de5c281a99e1",
  measurementId: "G-V2754XTYVF"
};

let app, auth, db, storage, provider;
let isFirebaseConfigured = false;

try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        provider = new GoogleAuthProvider();
        isFirebaseConfigured = true;
    }
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

export {
  app,
  auth,
  db,
  storage,
  provider,
  isFirebaseConfigured,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL
};