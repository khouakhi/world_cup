"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { MobileNav } from "@/components/MobileNav";
import type { League, TopThreePrediction } from "@/types";
import { TOP_THREE_POINTS } from "@/types";
import { Medal } from "lucide-react";

interface Team {
  id: number;
  name: string;
  logo: string | null;
}

export default function TopThreePage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [prediction, setPrediction] = useState<Partial<TopThreePrediction>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const leaguesRes = await fetch("/api/leagues");
      if (leaguesRes.status === 401) {
        router.push("/auth");
        return;
      }
      const leaguesData = await leaguesRes.json();
      setLeague(
        leaguesData.leagues?.find((l: League) => l.id === leagueId) ?? null
      );

      const teamsRes = await fetch("/api/matches", { method: "POST" });
      const teamsData = await teamsRes.json();
      setTeams(teamsData.teams ?? []);

      const res = await fetch(`/api/top-three?league_id=${leagueId}`);
      const data = await res.json();
      if (data.top_three) setPrediction(data.top_three);
    }
    load();
  }, [leagueId, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/top-three", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        league_id: leagueId,
        first_team_id: prediction.first_team_id,
        first_team_name: prediction.first_team_name,
        second_team_id: prediction.second_team_id,
        second_team_name: prediction.second_team_name,
        third_team_id: prediction.third_team_id,
        third_team_name: prediction.third_team_name,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to save");
    } else {
      setMessage("Top 3 saved!");
      setPrediction(data.top_three);
    }
  }

  function selectTeam(
    slot: "first" | "second" | "third",
    team: Team
  ) {
    if (slot === "first") {
      setPrediction((p) => ({
        ...p,
        first_team_id: team.id,
        first_team_name: team.name,
      }));
    } else if (slot === "second") {
      setPrediction((p) => ({
        ...p,
        second_team_id: team.id,
        second_team_name: team.name,
      }));
    } else {
      setPrediction((p) => ({
        ...p,
        third_team_id: team.id,
        third_team_name: team.name,
      }));
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <Nav leagueName={league?.name} leagueId={leagueId} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold">
          <Medal className="h-6 w-6 text-gold-400" />
          Top 3 Podium
        </h1>
        <p className="mb-6 text-sm text-white/60">
          Predict the final podium before the tournament starts. Points are
          awarded automatically when the final and 3rd-place match finish.
        </p>

        <div className="card mb-6 p-4 text-sm">
          <div className="flex justify-between border-b border-white/10 py-2">
            <span>🥇 1st place</span>
            <span className="font-bold text-gold-400">{TOP_THREE_POINTS.first} pts</span>
          </div>
          <div className="flex justify-between border-b border-white/10 py-2">
            <span>🥈 2nd place</span>
            <span className="font-bold text-gold-400">{TOP_THREE_POINTS.second} pts</span>
          </div>
          <div className="flex justify-between py-2">
            <span>🥉 3rd place</span>
            <span className="font-bold text-gold-400">{TOP_THREE_POINTS.third} pts</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <TeamSelect
            label="🥇 1st place — Champion"
            teams={teams}
            selectedId={prediction.first_team_id}
            onSelect={(t) => selectTeam("first", t)}
          />
          <TeamSelect
            label="🥈 2nd place — Runner-up"
            teams={teams}
            selectedId={prediction.second_team_id}
            onSelect={(t) => selectTeam("second", t)}
          />
          <TeamSelect
            label="🥉 3rd place — Bronze"
            teams={teams}
            selectedId={prediction.third_team_id}
            onSelect={(t) => selectTeam("third", t)}
          />

          {prediction.points_awarded !== undefined && prediction.points_awarded > 0 && (
            <div className="card p-4 text-center">
              <span className="text-sm text-white/60">Your podium score</span>
              <div className="text-2xl font-bold text-gold-400">
                {prediction.points_awarded} pts
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || prediction.is_locked}
            className="btn-primary w-full"
          >
            {saving ? "Saving…" : prediction.is_locked ? "Locked" : "Save top 3"}
          </button>

          {message && (
            <p
              className={`text-sm ${message.includes("saved") ? "text-green-400" : "text-red-400"}`}
            >
              {message}
            </p>
          )}
        </form>
      </main>
      <MobileNav leagueId={leagueId} />
    </div>
  );
}

function TeamSelect({
  label,
  teams,
  selectedId,
  onSelect,
}: {
  label: string;
  teams: Team[];
  selectedId?: number | null;
  onSelect: (team: Team) => void;
}) {
  return (
    <div className="card p-4">
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <select
        className="input"
        value={selectedId ?? ""}
        onChange={(e) => {
          const team = teams.find((t) => t.id === parseInt(e.target.value, 10));
          if (team) onSelect(team);
        }}
      >
        <option value="">Select team…</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
