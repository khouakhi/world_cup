"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Star, Lock } from "lucide-react";
import type { Match, Prediction } from "@/types";
import { cn, formatKickoff, isMatchOpen, isLiveStatus, isFinishedStatus } from "@/lib/utils";
import {
  CAPTAIN_PICK_NAME,
  EMPTY_MISSED_DEADLINE,
  pointsResultLabel,
} from "@/lib/copy/banter";

interface MatchCardProps {
  match: Match & { preview?: { preview_text: string; fun_fact: string | null } | null };
  leagueId: string;
  prediction?: Prediction;
  isCaptain?: boolean;
  onPredict: (matchId: string, home: number, away: number) => Promise<void>;
  onCaptainPick: (matchId: string) => Promise<void>;
}

export function MatchCard({
  match,
  prediction,
  isCaptain,
  onPredict,
  onCaptainPick,
}: MatchCardProps) {
  const [home, setHome] = useState(prediction?.home_score ?? 0);
  const [away, setAway] = useState(prediction?.away_score ?? 0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!dirty) {
      setHome(prediction?.home_score ?? 0);
      setAway(prediction?.away_score ?? 0);
    }
  }, [prediction?.home_score, prediction?.away_score, match.id, dirty]);

  const open = isMatchOpen(match.kickoff_at, match.is_locked);
  const live = isLiveStatus(match.status);
  const finished = isFinishedStatus(match.status);

  async function handleSave() {
    setSaving(true);
    try {
      await onPredict(match.id, home, away);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleCaptain() {
    await onCaptainPick(match.id);
  }

  return (
    <div className={cn("card p-4", isCaptain && "ring-2 ring-gold-400")}>
      <div className="mb-3 flex items-center justify-between text-xs text-white/60">
        <span>{match.stage ?? match.round ?? "World Cup"}</span>
        <div className="flex items-center gap-2">
          {live && (
            <span className="live-pulse flex items-center gap-1 text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              LIVE
            </span>
          )}
          {isCaptain && (
            <span className="badge-pill text-gold-400">
              <Star className="h-3 w-3 fill-current" /> Banker
            </span>
          )}
          {!open && !finished && (
            <span className="badge-pill" title={EMPTY_MISSED_DEADLINE}>
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <TeamBlock name={match.home_team_name} logo={match.home_team_logo} />
        <div className="text-center">
          {finished || live ? (
            <div className="text-2xl font-bold">
              {match.home_score} – {match.away_score}
            </div>
          ) : open ? (
            <div className="flex items-center gap-2">
              <ScoreInput
                value={home}
                onChange={(v) => {
                  setDirty(true);
                  setHome(v);
                }}
              />
              <span className="text-white/40">–</span>
              <ScoreInput
                value={away}
                onChange={(v) => {
                  setDirty(true);
                  setAway(v);
                }}
              />
            </div>
          ) : (
            <div className="text-lg text-white/60">vs</div>
          )}
          <div className="mt-1 text-xs text-white/50">
            {formatKickoff(match.kickoff_at)}
          </div>
        </div>
        <TeamBlock name={match.away_team_name} logo={match.away_team_logo} align="right" />
      </div>

      {prediction && open && !dirty && (
        <p className="mt-2 text-center text-xs text-gold-400/90">
          Your pick: {prediction.home_score}–{prediction.away_score}
        </p>
      )}

      {prediction && finished && prediction.points_awarded !== null && (
        <div className="mt-3 text-center text-sm">
          Your pick: {prediction.home_score}–{prediction.away_score} ·{" "}
          <span className="font-bold text-gold-400">
            +{prediction.points_awarded} pts
          </span>
          <span className="text-white/50">
            {" "}
            · {pointsResultLabel(prediction.points_awarded)}
          </span>
        </div>
      )}

      {!open && !finished && !prediction && (
        <p className="mt-3 text-center text-xs text-red-300/90">{EMPTY_MISSED_DEADLINE}</p>
      )}

      {open && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 text-sm"
          >
            {saving ? "Saving…" : prediction ? "Update Pick" : "Lock In Your Pick"}
          </button>
          <button
            type="button"
            onClick={handleCaptain}
            className={cn(
              "btn-secondary text-sm",
              isCaptain && "border-gold-400 text-gold-400"
            )}
            title={`${CAPTAIN_PICK_NAME} — double points`}
          >
            <Star className={cn("h-4 w-4", isCaptain && "fill-current")} />
          </button>
        </div>
      )}

      {match.preview && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full text-left text-xs text-gold-400/80 hover:text-gold-400"
        >
          {expanded ? "Hide preview ▲" : "Match preview ▼"}
        </button>
      )}

      {expanded && match.preview && (
        <div className="mt-2 rounded-xl bg-white/5 p-3 text-sm text-white/80">
          <p>{match.preview.preview_text}</p>
          {match.preview.fun_fact && (
            <p className="mt-2 text-xs text-gold-400/80">
              💡 {match.preview.fun_fact}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TeamBlock({
  name,
  logo,
  align = "left",
}: {
  name: string;
  logo: string | null;
  align?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center gap-1",
        align === "right" && "text-right"
      )}
    >
      {logo && (
        <Image src={logo} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
      )}
      <span className="max-w-[90px] text-center text-xs font-medium leading-tight">
        {name}
      </span>
    </div>
  );
}

function ScoreInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      value={value}
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
      className="w-12 rounded-lg border border-white/20 bg-white/10 py-1 text-center text-lg font-bold"
    />
  );
}
