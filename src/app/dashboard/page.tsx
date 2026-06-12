"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Copy, Check, Plus } from "lucide-react";
import { isLeagueAdmin } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import { getFirebaseAuth } from "@/lib/firebase/client";
import type { League } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    initDashboard();
  }, []);

  async function initDashboard() {
    const auth = getFirebaseAuth();
    await auth.authStateReady();

    const meRes = await apiFetch("/api/auth/me");
    if (!meRes.ok) {
      router.push("/auth");
      return;
    }
    const meData = await meRes.json();
    const admin = isLeagueAdmin(meData.user?.email);
    setIsAdmin(admin);

    const leaguesRes = await apiFetch("/api/leagues");
    if (!leaguesRes.ok) {
      router.push("/auth");
      return;
    }
    const leaguesData = await leaguesRes.json();
    let userLeagues: League[] = leaguesData.leagues ?? [];

    if (!admin) {
      if (userLeagues.length === 0) {
        const joinRes = await apiFetch("/api/leagues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "auto_join_main" }),
        });
        const joinData = await joinRes.json();
        if (joinRes.ok && joinData.league) {
          router.replace(`/league/${joinData.league.id}`);
          return;
        }
        setError(joinData.error ?? "Could not join the league");
      } else {
        router.replace(`/league/${userLeagues[0].id}`);
        return;
      }
    }

    setLeagues(userLeagues);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await apiFetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: newLeagueName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create league");
      router.push(`/league/${data.league.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCreating(false);
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-white/60">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold">League organiser</h1>
        <p className="mb-6 text-sm text-white/60">
          Manage your World Cup 2026 league and share the invite code with family
          and friends.
        </p>

        {leagues.length > 0 && (
          <div className="mb-8 space-y-3">
            {leagues.map((league) => (
              <div key={league.id} className="card flex items-center justify-between p-4">
                <button
                  type="button"
                  onClick={() => router.push(`/league/${league.id}`)}
                  className="text-left"
                >
                  <div className="font-semibold">{league.name}</div>
                  <div className="text-sm text-white/60">Tap to open</div>
                </button>
                <button
                  type="button"
                  onClick={() => copyCode(league.invite_code)}
                  className="badge-pill hover:bg-white/20"
                >
                  {copied === league.invite_code ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {league.invite_code}
                </button>
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Plus className="h-5 w-5 text-gold-400" />
              Create a league
            </h2>
            <form onSubmit={handleCreate}>
              <input
                className="input mb-4"
                placeholder="e.g. World Cup 2026"
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                required
                minLength={2}
              />
              <button type="submit" disabled={creating} className="btn-primary w-full">
                {creating ? "Creating…" : "Create league"}
              </button>
            </form>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </main>
    </div>
  );
}
