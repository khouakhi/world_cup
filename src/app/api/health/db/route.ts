import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { isFirestoreQuotaError } from "@/lib/db/errors";

/** Lightweight Firestore probe — no auth required. */
export async function GET() {
  try {
    await getAdminDb().collection("leagues").limit(1).get();
    return NextResponse.json({ ok: true, firestore: "reachable" });
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      return NextResponse.json(
        {
          ok: false,
          firestore: "quota_exceeded",
          message:
            "Firestore is still blocked. Blaze upgrades can take up to 90 minutes to take effect.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        firestore: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
