import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAPkXwBhvKUB5r6rkf1AjXnImPKxDfTDmQ",
  authDomain: "fintrack-10fff.firebaseapp.com",
  projectId: "fintrack-10fff",
  storageBucket: "fintrack-10fff.firebasestorage.app",
  messagingSenderId: "737703453622",
  appId: "1:737703453622:web:ee5fdef6fa273db6809717",
  measurementId: "G-P05Z0NDJPM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
