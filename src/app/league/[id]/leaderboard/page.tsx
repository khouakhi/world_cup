"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Podium, LeaderboardTable } from "@/components/Leaderboard";
import { MobileNav } from "@/components/MobileNav";
import type { League, LeaderboardEntry } from "@/types";
import { TOP_THREE_POINTS } from "@/types";

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (!meData.user) {
        router.push("/auth");
        return;
      }
      setUserId(meData.user.uid);

      const leaguesRes = await fetch("/api/leagues");
      const leaguesData = await leaguesRes.json();
      setLeague(
        leaguesData.leagues?.find((l: League) => l.id === leagueId) ?? null
      );

      const lbRes = await fetch(`/api/leaderboard?league_id=${leagueId}`);
      const lbData = await lbRes.json();
      setEntries(lbData.leaderboard ?? []);
    }
    load();
  }, [leagueId, router]);

  return (
    <div className="min-h-screen pb-20">
      <Nav leagueName={league?.name} leagueId={leagueId} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold">Leaderboard</h1>

        <div className="mb-8">
          <Podium entries={entries.slice(0, 3)} />
        </div>

        <LeaderboardTable entries={entries} highlightUserId={userId ?? undefined} />

        <div className="card mt-6 p-4 text-sm text-white/60">
          <h3 className="mb-2 font-semibold text-white">Scoring</h3>
          <ul className="space-y-1">
            <li>Correct result: 1 pt</li>
            <li>Correct goal difference: 2 pts</li>
            <li>Exact score: 5 pts</li>
            <li>Captain&apos;s pick: 2× multiplier</li>
            <li>Top 3 podium: 1st {TOP_THREE_POINTS.first} · 2nd {TOP_THREE_POINTS.second} · 3rd {TOP_THREE_POINTS.third} pts</li>
            <li>Bracket: champion 20 · runner-up 10 · semi-finalist 5 each</li>
          </ul>
        </div>
      </main>
      <MobileNav leagueId={leagueId} />
    </div>
  );
}
