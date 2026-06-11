"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamOption {
  id: number;
  name: string;
  logo: string | null;
}

interface TeamPickerProps {
  label: string;
  teams: TeamOption[];
  selectedId?: number | null;
  onSelect: (team: TeamOption) => void;
  compact?: boolean;
  placeholder?: string;
}

export function TeamPicker({
  label,
  teams,
  selectedId,
  onSelect,
  compact = false,
  placeholder = "Select team…",
}: TeamPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = teams.find((t) => t.id === selectedId) ?? null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative",
        open && "z-50",
        compact ? "" : "card p-4"
      )}
    >
      <label
        className={cn(
          "mb-2 block font-semibold",
          compact ? "text-xs text-white/60" : "text-sm"
        )}
      >
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selected ? (
          <TeamRow team={selected} />
        ) : (
          <span className="text-white/50">{placeholder}</span>
        )}
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-white/50 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/20 bg-[#0f172a] shadow-2xl ring-1 ring-black/30"
          role="listbox"
        >
          {teams.length === 0 ? (
            <li className="px-4 py-3 text-sm text-white/50">No teams available</li>
          ) : (
            teams.map((team) => (
              <li key={team.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={team.id === selectedId}
                  onClick={() => {
                    onSelect(team);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center bg-[#0f172a] px-3 py-2.5 text-left text-sm transition hover:bg-pitch-800",
                    team.id === selectedId && "bg-pitch-800 ring-1 ring-inset ring-gold-400/40"
                  )}
                >
                  <TeamRow team={team} />
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function TeamRow({ team }: { team: TeamOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <TeamFlag name={team.name} logo={team.logo} />
      <span className="truncate font-medium">{team.name}</span>
    </span>
  );
}

function TeamFlag({ name, logo }: { name: string; logo: string | null }) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt=""
        width={24}
        height={24}
        className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-white/15"
        unoptimized
      />
    );
  }

  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold ring-1 ring-white/15"
      aria-hidden
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
