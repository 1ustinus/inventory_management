import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// We use a safe check to allow the app to boot even without Firebase for UI prototyping
// The actual config is injected by set_up_firebase
let firebaseConfig: any = {};

// In AI Studio, the config is globally available or in a specific file.
// We try to initialize with any safe default.
const app = getApps().length === 0 ? initializeApp({
  apiKey: "PLACEHOLDER",
  authDomain: "PLACEHOLDER",
  projectId: "PLACEHOLDER",
  storageBucket: "PLACEHOLDER",
  messagingSenderId: "PLACEHOLDER",
  appId: "PLACEHOLDER"
}) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

// Simple connection test as per Firebase guidelines
export async function testFirebaseConnection() {
  if (!firebaseConfig.apiKey) return;
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
