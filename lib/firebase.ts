import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBgEo_-VjWitRG_S0-mAct72Y81ZFl158g",
  authDomain: "brainbuddy-ec34d.firebaseapp.com",
  projectId: "brainbuddy-ec34d",
  storageBucket: "brainbuddy-ec34d.firebasestorage.app",
  messagingSenderId: "508514678211",
  appId: "1:508514678211:web:3d906bc8d3ea4c4fe13976",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);