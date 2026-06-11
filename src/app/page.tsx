import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Target,
  Star,
  Crown,
  Award,
  Users,
  Timer,
  ChevronRight,
} from "lucide-react";
import { BRACKET_POINTS } from "@/types";
import { TournamentPreviewCard } from "@/components/TournamentPreviewCard";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=80";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[92vh]">
        <Image
          src={HERO_IMAGE}
          alt="Football on a green pitch"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-pitch-900/85 via-pitch-900/75 to-pitch-900" />
        <div className="hero-pitch-lines absolute inset-0 opacity-60" />
        <div className="hero-glow absolute inset-0" />

        {/* Centre circle */}
        <div
          className="pointer-events-none absolute left-1/2 top-[58%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20 md:h-64 md:w-64"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col px-4 pb-16 pt-10 md:px-8">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-7 w-7 text-gold-400" />
              <span className="font-bold tracking-tight">World Cup Predictions</span>
            </div>
            <Link
              href="/auth"
              className="hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/20 sm:inline-flex"
            >
              Sign in
            </Link>
          </header>

          <div className="mt-auto grid flex-1 items-center gap-10 pb-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <div className="scoreboard-glow mb-6 inline-flex items-center gap-3 rounded-2xl border border-gold-400/30 bg-black/30 px-4 py-2 backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-400" />
                </span>
                <span className="text-sm font-semibold tracking-wide text-gold-400">
                  FIFA WORLD CUP 2026
                </span>
              </div>

              <h1 className="mb-5 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl">
                Predict.
                <br />
                <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 bg-clip-text text-transparent">
                  Compete.
                </span>
                <br />
                Win bragging rights.
              </h1>

              <p className="mb-8 max-w-xl text-lg text-white/75 md:text-xl">
                A private league for family and football friends. Call the scores,
                back your captain, nail the bracket, and climb the table.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/auth"
                  className="btn-primary group px-8 py-3.5 text-lg shadow-lg shadow-gold-500/20"
                >
                  Join the league
                  <ChevronRight className="ml-1 h-5 w-5 transition group-hover:translate-x-0.5" />
                </Link>
                <Link href="/auth" className="btn-secondary px-8 py-3.5 text-lg">
                  I have an account
                </Link>
              </div>

              <p className="mt-5 flex items-center gap-2 text-sm text-white/50">
                <Timer className="h-4 w-4 shrink-0" />
                Predictions lock 15 minutes before kick-off
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <TournamentPreviewCard />

              <div className="football-float absolute -right-4 -top-8 h-20 w-20 drop-shadow-2xl md:-right-8 md:h-28 md:w-28">
                <Image
                  src="/football.svg"
                  alt=""
                  width={112}
                  height={112}
                  className="h-full w-full"
                  aria-hidden
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-white/10 pt-6 text-sm text-white/50">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gold-400" />
              Private league · invite only
            </span>
            <span>USA · Canada · Mexico</span>
            <span>11 June to 19 July 2026</span>
          </div>
        </div>
      </section>

      {/* Scoring */}
      <section className="relative bg-pitch-900 px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">How you score</h2>
            <p className="mx-auto max-w-2xl text-white/60">
              Four ways to earn points, from every matchday to the final whistle.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <ScoringCard
              icon={<Target className="h-6 w-6 text-gold-400" />}
              title="Score predictions"
              summary="Predict the full-time score for every match."
              accent="from-emerald-500/20 to-transparent"
              points={[
                "Exact score: 5 points",
                "Correct goal difference (not exact): 2 points",
                "Correct result only (win, draw, or loss): 1 point",
                "Only your best tier counts per match (not stacked)",
                "Submit before kick-off; locks 15 minutes before the match starts",
              ]}
            />
            <ScoringCard
              icon={<Star className="h-6 w-6 text-gold-400" />}
              title="Captain's pick"
              summary="Double your points on one match each matchday."
              accent="from-gold-500/20 to-transparent"
              points={[
                "Choose one match per matchday as your captain",
                "All points from that match are doubled",
                "Exact score with captain: 10 points (5 × 2)",
                "Goal difference with captain: 4 points (2 × 2)",
                "Correct result with captain: 2 points (1 × 2)",
                "Pick your captain before the first match of the day kicks off",
              ]}
            />
            <ScoringCard
              icon={<Crown className="h-6 w-6 text-gold-400" />}
              title="Bracket challenge"
              summary="Call the tournament before the opening game."
              accent="from-violet-500/20 to-transparent"
              points={[
                `Champion: ${BRACKET_POINTS.champion} points`,
                `Runner-up: ${BRACKET_POINTS.runnerUp} points`,
                `Each correct semi-finalist: ${BRACKET_POINTS.semiFinalist} points (pick 4 teams)`,
                "Points are added together (up to 50 points if everything is correct)",
                "Submit before the tournament starts; locked once the first match kicks off",
                "Scored automatically after the final",
              ]}
            />
            <ScoringCard
              icon={<Award className="h-6 w-6 text-gold-400" />}
              title="Badges & banter"
              summary="Fun achievements alongside the points race."
              accent="from-sky-500/20 to-transparent"
              points={[
                "Oracle: three exact scores in a row",
                "Scoreline Sniper: five or more exact scores in the tournament",
                "Captain Clutch: captain's pick earns maximum points on a match",
                "Group Stage Guru: most match points during the group stage",
                "Knockout King: most match points during the knockout stage",
                "Chaos Agent: the boldest wrong calls that still entertained the league",
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-white/10 bg-gradient-to-r from-pitch-800 to-pitch-900 px-4 py-16 md:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <Trophy className="mb-4 h-12 w-12 text-gold-400" />
          <h2 className="mb-3 text-2xl font-bold md:text-3xl">
            Ready for kick-off?
          </h2>
          <p className="mb-8 max-w-lg text-white/65">
            Create your account, join or start a league, and start predicting before
            the first whistle.
          </p>
          <Link href="/auth" className="btn-primary px-10 py-3.5 text-lg">
            Get started (it&apos;s free)
          </Link>
        </div>
      </section>
    </main>
  );
}

function ScoringCard({
  icon,
  title,
  summary,
  points,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  summary: string;
  points: string[];
  accent: string;
}) {
  return (
    <div className="group card relative overflow-hidden p-6 transition hover:border-gold-400/30 hover:bg-white/[0.07]">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-0 transition group-hover:opacity-100`}
      />
      <div className="relative">
        <div className="mb-4 flex items-start gap-3">
          <div className="inline-flex rounded-xl bg-white/10 p-2.5">{icon}</div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-white/60">{summary}</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-white/70">
          {points.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400/80" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
