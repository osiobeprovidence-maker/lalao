import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBv_Cf6i4RvL2pikdVhGb8cHUDKYpjjSRA",
  authDomain: "uselalaoapp.firebaseapp.com",
  projectId: "uselalaoapp",
  storageBucket: "uselalaoapp.firebasestorage.app",
  messagingSenderId: "853680775586",
  appId: "1:853680775586:web:1d3beaf2dd0c8dec35d2fb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

export const uploadFileToStorage = async (file: File, folder: string) => {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const storageRef = ref(storage, `${folder}/${safeName}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
