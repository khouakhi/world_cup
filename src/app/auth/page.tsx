"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { apiFetch, isFirebaseSignedIn } from "@/lib/api-client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    isFirebaseSignedIn().then((signedIn) => {
      if (!cancelled && signedIn) {
        router.replace("/dashboard");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const auth = getFirebaseAuth();
    await setPersistence(auth, browserLocalPersistence);

    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        await apiFetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: displayName.trim() }),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        await apiFetch("/api/auth/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      }

      router.replace("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.includes("auth/invalid-credential")) {
        setMessage("Wrong email or password. Try again or create an account.");
      } else if (msg.includes("auth/email-already-in-use")) {
        setMessage("That email is already registered. Try signing in instead.");
      } else if (msg.includes("auth/weak-password")) {
        setMessage("Password must be at least 6 characters.");
      } else {
        setMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Trophy className="h-8 w-8 text-gold-400" />
            <span className="text-xl font-bold">World Cup Predictions</span>
          </Link>
        </div>

        <div className="card p-6">
          <h1 className="mb-2 text-xl font-semibold">
            {isSignUp ? "Create account" : "Sign in"}
          </h1>
          <p className="mb-6 text-sm text-white/60">
            Use your email and a password (at least 6 characters).
          </p>

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <input
                className="input mb-3"
                placeholder="Display name (e.g. Ahmed)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
            )}
            <input
              className="input mb-3"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              className="input mb-4"
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="mt-4 w-full text-sm text-white/60 hover:text-white"
          >
            {isSignUp ? "Already have an account? Sign in" : "New here? Create account"}
          </button>
        </div>
      </div>
    </main>
  );
}
