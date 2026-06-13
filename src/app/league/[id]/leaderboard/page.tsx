"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Podium, LeaderboardTable } from "@/components/Leaderboard";
import { LeagueBanterPanel } from "@/components/LeagueBanterPanel";
import { END_OF_TOURNAMENT_AWARDS, LEAGUE_TABLE_TITLE } from "@/lib/copy/banter";
import type { League, LeaderboardEntry } from "@/types";
import { apiFetch, isFirebaseSignedIn } from "@/lib/api-client";

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!(await isFirebaseSignedIn())) {
        router.replace("/auth");
        return;
      }

      const meRes = await apiFetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setUserId(meData.user.uid);
      }

      const leaguesRes = await apiFetch("/api/leagues");
      const leaguesData = await leaguesRes.json();
      setLeague(
        leaguesData.leagues?.find((l: League) => l.id === leagueId) ?? null
      );

      const lbRes = await apiFetch(`/api/leaderboard?league_id=${leagueId}`);
      const lbData = await lbRes.json();
      setEntries(lbData.leaderboard ?? []);
    }
    load();
  }, [leagueId, router]);

  return (
    <div className="min-h-screen">
      <Nav leagueName={league?.name} leagueId={leagueId} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-2 text-2xl font-bold">{LEAGUE_TABLE_TITLE}</h1>
        <p className="mb-6 text-sm text-white/55">
          League table — points from match picks and knockout guesses.
        </p>

        <LeagueBanterPanel entries={entries} />

        <div className="mb-8">
          <Podium entries={entries.slice(0, 3)} />
        </div>

        <LeaderboardTable entries={entries} highlightUserId={userId ?? undefined} />

        <div className="card mt-8 p-4 text-sm">
          <h3 className="mb-3 font-semibold text-gold-400">🏁 End-of-tournament awards</h3>
          <ul className="space-y-1.5 text-white/65">
            {END_OF_TOURNAMENT_AWARDS.map(({ position, award }) => (
              <li key={position}>
                <span className="text-white/45">{position}:</span> {award}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/40 italic">
            Specials (Mystic Meg, Biggest Bottle Job, The Southgate Award, The VAR
            Award, TalkSPORT Pundit Award) handed out when the dust settles.
          </p>
        </div>
      </main>
    </div>
  );
}
