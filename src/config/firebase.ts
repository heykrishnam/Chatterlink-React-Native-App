import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDXFdg60qtmU_f7uS948WGDFpStY9GuGPA",
  authDomain: "wevitchat-fb897.firebaseapp.com",
  projectId: "wevitchat-fb897",
  storageBucket: "wevitchat-fb897.appspot.com",
  messagingSenderId: "839408081278",
  appId: "1:839408081278:web:c5ad9cd9022f92510d7b2f",
  measurementId: "G-338S0XFLG4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };

export default app; 