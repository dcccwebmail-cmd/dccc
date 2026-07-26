// IMPORTANT: Replace the placeholder values below with your own Firebase project's configuration.
// You can find these details in your Firebase project settings under "General".
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select an existing one.
// 3. Click the gear icon > Project settings.
// 4. In the "Your apps" card, select the web app or create one.
// 5. Choose "Config" and copy the configuration object.

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};
