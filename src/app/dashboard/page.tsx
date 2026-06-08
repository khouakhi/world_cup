"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { LeagueSelector } from "@/components/LeagueSelector";
import { Copy, Check } from "lucide-react";
import type { League } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchLeagues();
  }, []);

  async function fetchLeagues() {
    const res = await fetch("/api/leagues");
    if (res.status === 401) {
      router.push("/auth");
      return;
    }
    const data = await res.json();
    setLeagues(data.leagues ?? []);
    setLoading(false);
  }

  function handleLeagueAction(league: League) {
    router.push(`/league/${league.id}`);
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
        <h1 className="mb-6 text-2xl font-bold">Your leagues</h1>

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

        <LeagueSelector onCreated={handleLeagueAction} onJoined={handleLeagueAction} />
      </main>
    </div>
  );
}
