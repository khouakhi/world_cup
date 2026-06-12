export function isFirestoreQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("Quota exceeded")
  );
}

/** Shown when Firestore rejects requests after the Spark daily cap was hit. */
export const FIRESTORE_QUOTA_SPARK_MESSAGE =
  "Firebase database daily limit reached. In Firebase Console → Upgrade to Blaze (pay-as-you-go). It stays free for small apps like this — you only pay if you exceed generous free limits.";

/** Shown after Blaze upgrade while Google lifts the temporary database lock. */
export const FIRESTORE_QUOTA_BLAZE_MESSAGE =
  "Firebase is still applying your Blaze upgrade (this can take 30–90 minutes after you upgrade). " +
  "Confirm project world-cup-predictions-48f1d shows Blaze under Usage and billing, then wait and tap Retry. " +
  "If this persists for more than 2 hours, contact Firebase Support — the database may need a manual unlock.";

export const FIRESTORE_QUOTA_MESSAGE = FIRESTORE_QUOTA_BLAZE_MESSAGE;
