import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/analytics';
import 'firebase/compat/functions';
import 'firebase/compat/firestore';

// (remove the TODO and hard-coded placeholders)
const firebaseConfig = {
  apiKey: "AIzaSyD-9tSrQWZ_1OeR2Pd6mlWXcCizrPALQ3E",
  authDomain: "meme-app-eabc1.firebaseapp.com",
  projectId: "meme-app-eabc1",
  storageBucket: "meme-app-eabc1.firebasestorage.app",
  messagingSenderId: "354794260378",
  appId: "1:354794260378:android:2fd1504fe7a1267a9bdc23",
  measurementId: "G-494250859",
  databaseURL: "https://meme-app-eabc1-default-rtdb.firebaseio.com",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase Analytics
export const analytics = firebase.analytics();

// Initialize Firebase Authentication and get a reference to the service
export const auth = firebase.auth();

// Initialize Firebase Functions
export const functions = firebase.functions();

// Initialize Firestore
export const firestore = firebase.firestore();