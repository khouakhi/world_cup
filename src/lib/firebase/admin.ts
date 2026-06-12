import admin from "firebase-admin";
import fs from "fs";
import path from "path";

function normaliseServiceAccount(
  account: admin.ServiceAccount
): admin.ServiceAccount {
  const raw = account as admin.ServiceAccount & { private_key?: string };
  const key = raw.privateKey ?? raw.private_key;
  if (typeof key === "string") {
    raw.privateKey = key.replace(/\\n/g, "\n");
  }
  return raw;
}

function loadServiceAccount(): admin.ServiceAccount {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      let parsed: unknown = JSON.parse(json);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
      return normaliseServiceAccount(parsed as admin.ServiceAccount);
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. On Vercel, paste the entire firebase-service-account.json file as the value."
      );
    }
  }

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (filePath) {
    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    const raw = fs.readFileSync(resolved, "utf8");
    return normaliseServiceAccount(JSON.parse(raw) as admin.ServiceAccount);
  }

  throw new Error(
    "Firebase admin not configured. For local dev, set FIREBASE_SERVICE_ACCOUNT_PATH. " +
      "For production, set FIREBASE_SERVICE_ACCOUNT_JSON secret (see DEPLOY_ONLINE.md)."
  );
}

function initAdmin(): admin.app.App {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccount = loadServiceAccount();
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    serviceAccount.projectId;

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
  });
}

export function getAdminApp(): admin.app.App {
  return initAdmin();
}

export function getAdminAuth(): admin.auth.Auth {
  return getAdminApp().auth();
}

export function getAdminDb(): admin.firestore.Firestore {
  return getAdminApp().firestore();
}

export type { admin };
