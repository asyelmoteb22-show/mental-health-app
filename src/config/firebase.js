// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// YOUR CONFIG HERE - paste the config from Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export for use in other files
export default app;

//The firebase.js file configures and initializes Firebase for a mental health application. It imports necessary functions from the Firebase SDK (initializeApp, getAuth, getFirestore, getStorage) to enable authentication, database, and storage functionalities. The firebaseConfig object, populated with environment variables, securely stores project credentials. The initializeApp function establishes the connection to the Firebase project. Subsequently, the code initializes and exports Firebase Authentication (auth), Cloud Firestore (db), and Cloud Storage (storage) services, linking them to the initialized Firebase app. These exported services allow other parts of the application to interact with Firebase features. Finally, the initialized Firebase app instance is exported as the default export, providing a core connection point for other modules if needed, ensuring a centralized and accessible Firebase setup for the entire application.