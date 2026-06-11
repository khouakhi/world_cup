"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Podium, LeaderboardTable } from "@/components/Leaderboard";
import { MobileNav } from "@/components/MobileNav";
import type { League, LeaderboardEntry } from "@/types";

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
      </main>
      <MobileNav leagueId={leagueId} />
    </div>
  );
}
