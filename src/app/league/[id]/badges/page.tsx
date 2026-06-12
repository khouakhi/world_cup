"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { BadgeGrid } from "@/components/BadgeGrid";
import { BADGE_LABELS, type Badge, type League } from "@/types";
import { apiFetch, isFirebaseSignedIn } from "@/lib/api-client";

export default function BadgesPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [memberNames, setMemberNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    async function load() {
      if (!(await isFirebaseSignedIn())) {
        router.replace("/auth");
        return;
      }

      const leaguesRes = await apiFetch("/api/leagues");
      const leaguesData = await leaguesRes.json();
      setLeague(
        leaguesData.leagues?.find((l: League) => l.id === leagueId) ?? null
      );

      const badgesRes = await apiFetch(`/api/badges?league_id=${leagueId}`);
      const badgesData = await badgesRes.json();
      setBadges(badgesData.badges ?? []);

      const names = new Map<string, string>();
      for (const [userId, name] of Object.entries(badgesData.memberNames ?? {})) {
        names.set(userId, name as string);
      }
      setMemberNames(names);
    }
    load();
  }, [leagueId, router]);

  return (
    <div className="min-h-screen">
      <Nav leagueName={league?.name} leagueId={leagueId} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-2 text-2xl font-bold">Badges</h1>
        <p className="mb-6 text-sm text-white/60">
          Earned automatically as the tournament unfolds
        </p>

        <BadgeGrid badges={badges} memberNames={memberNames} />

        <div className="card mt-8 p-4">
          <h3 className="mb-3 font-semibold">All badges</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(BADGE_LABELS).map(([key, info]) => (
              <div key={key} className="flex items-center gap-2 text-sm text-white/70">
                <span>{info.emoji}</span>
                <span className="font-medium text-white">{info.title}</span>
                <span className="text-white/50">· {info.description}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
