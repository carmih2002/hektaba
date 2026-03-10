// ============================================================
//  FIREBASE CONFIG
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyCCVAj6n2ot3_OfBkKipCO7EOOQsKCJ394",
  authDomain: "learnwords-7c499.firebaseapp.com",
  projectId: "learnwords-7c499",
  storageBucket: "learnwords-7c499.firebasestorage.app",
  messagingSenderId: "888471552307",
  appId: "1:888471552307:web:157afbaa6db80c5597be46"
};

firebase.initializeApp(firebaseConfig);

const db   = firebase.firestore();
const auth = firebase.auth();
