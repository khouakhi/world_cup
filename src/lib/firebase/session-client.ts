"use client";

export async function refreshServerSession(
  idToken: string,
  displayName?: string,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, displayName }),
    signal,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? "Could not refresh session"
    );
  }
}
