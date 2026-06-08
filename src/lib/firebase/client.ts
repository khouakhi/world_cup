"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { firebaseConfig } from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getFirebaseApp(): FirebaseApp {
  if (!isBrowser()) {
    throw new Error("Firebase is only available in the browser");
  }

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!isBrowser()) {
    throw new Error("Firebase Auth is only available in the browser");
  }

  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}
