import { getAdminAuth, getAdminDb, type admin } from "@/lib/firebase/admin";

export interface DeleteUserResult {
  email: string;
  uid: string | null;
  deleted: {
    profile: number;
    leagueMembers: number;
    predictions: number;
    captainPicks: number;
    bracketPredictions: number;
    badges: number;
    auth: boolean;
  };
  errors: string[];
}

async function deleteQueryDocs(query: admin.firestore.Query): Promise<number> {
  const db = getAdminDb();
  const snap = await query.get();
  if (snap.empty) return 0;

  let count = 0;
  const batchSize = 400;
  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    for (const doc of docs.slice(i, i + batchSize)) {
      batch.delete(doc.ref);
      count += 1;
    }
    await batch.commit();
  }

  return count;
}

/** Remove a user from Firestore and Firebase Auth by email. */
export async function deleteUserByEmail(email: string): Promise<DeleteUserResult> {
  const normalised = email.trim().toLowerCase();
  const auth = getAdminAuth();
  const db = getAdminDb();
  const errors: string[] = [];

  let uid: string | null = null;
  try {
    const user = await auth.getUserByEmail(normalised);
    uid = user.uid;
  } catch {
    errors.push("No Firebase Auth account found for this email.");
  }

  const result: DeleteUserResult = {
    email: normalised,
    uid,
    deleted: {
      profile: 0,
      leagueMembers: 0,
      predictions: 0,
      captainPicks: 0,
      bracketPredictions: 0,
      badges: 0,
      auth: false,
    },
    errors,
  };

  if (!uid) return result;

  const profileRef = db.collection("profiles").doc(uid);
  if ((await profileRef.get()).exists) {
    await profileRef.delete();
    result.deleted.profile = 1;
  }

  result.deleted.leagueMembers = await deleteQueryDocs(
    db.collection("leagueMembers").where("user_id", "==", uid)
  );
  result.deleted.predictions = await deleteQueryDocs(
    db.collection("predictions").where("user_id", "==", uid)
  );
  result.deleted.captainPicks = await deleteQueryDocs(
    db.collection("captainPicks").where("user_id", "==", uid)
  );
  result.deleted.bracketPredictions = await deleteQueryDocs(
    db.collection("bracketPredictions").where("user_id", "==", uid)
  );
  result.deleted.badges = await deleteQueryDocs(
    db.collection("badges").where("user_id", "==", uid)
  );

  try {
    await auth.deleteUser(uid);
    result.deleted.auth = true;
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Failed to delete auth user."
    );
  }

  return result;
}
