export function isFirestoreQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("Quota exceeded")
  );
}

export const FIRESTORE_QUOTA_MESSAGE =
  "Firebase database daily limit reached. In Firebase Console → Upgrade to Blaze (pay-as-you-go). It stays free for small apps like this — you only pay if you exceed generous free limits. Alternatively, try again tomorrow when the daily quota resets.";
