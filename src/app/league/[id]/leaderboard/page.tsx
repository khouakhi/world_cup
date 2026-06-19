"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Podium, LeaderboardTable } from "@/components/Leaderboard";
import { LeagueBanterPanel } from "@/components/LeagueBanterPanel";
import { TournamentPrizes } from "@/components/TournamentPrizes";
import { LEAGUE_TABLE_TITLE } from "@/lib/copy/banter";
import type { League, LeaderboardEntry } from "@/types";
import { apiFetch, isFirebaseSignedIn } from "@/lib/api-client";
import { formatUpdatedAt } from "@/lib/utils";

const REFRESH_MS = 90 * 1000;

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [resultsUpdatedAt, setResultsUpdatedAt] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async (sync = true) => {
    const syncParam = sync ? "" : "&sync=0";
    const lbRes = await apiFetch(
      `/api/leaderboard?league_id=${leagueId}${syncParam}`
    );
    const lbData = await lbRes.json();
    setEntries(lbData.leaderboard ?? []);
    setResultsUpdatedAt(lbData.results_updated_at ?? null);
  }, [leagueId]);

  useEffect(() => {
    async function load() {
      if (!(await isFirebaseSignedIn())) {
        router.replace("/auth");
        return;
      }

      const [meRes, leaguesRes] = await Promise.all([
        apiFetch("/api/auth/me"),
        apiFetch("/api/leagues"),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setUserId(meData.user.uid);
      }

      const leaguesData = await leaguesRes.json();
      setLeague(
        leaguesData.leagues?.find((l: League) => l.id === leagueId) ?? null
      );

      await loadLeaderboard(true);
    }
    load();
  }, [leagueId, router, loadLeaderboard]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadLeaderboard(false);
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [loadLeaderboard]);

  return (
    <div className="min-h-screen">
      <Nav leagueName={league?.name} leagueId={leagueId} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-2 text-2xl font-bold">{LEAGUE_TABLE_TITLE}</h1>
        <p className="mb-2 text-sm text-white/55">
          League table. Points from match picks and knockout guesses.
        </p>
        {resultsUpdatedAt && (
          <p className="mb-6 text-xs text-white/40">
            Last updated {formatUpdatedAt(resultsUpdatedAt)}
          </p>
        )}
        {!resultsUpdatedAt && <div className="mb-6" />}

        <div className="mb-8">
          <TournamentPrizes compact />
        </div>

        <LeagueBanterPanel entries={entries} />

        <div className="mb-8">
          <Podium entries={entries.slice(0, 3)} />
        </div>

        <LeaderboardTable
          entries={entries}
          highlightUserId={userId ?? undefined}
          resultsUpdatedAt={resultsUpdatedAt}
        />
      </main>
    </div>
  );
}
