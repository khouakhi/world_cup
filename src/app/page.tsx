import Image from "next/image";
import Link from "next/link";
import { getAuthUserFromRequest } from "@/lib/firebase/auth";
import {
  Trophy,
  Target,
  Star,
  Crown,
  ChevronRight,
  UserPlus,
  KeyRound,
  Timer,
  Users,
} from "lucide-react";
import { BRACKET_POINTS } from "@/types";
import { BookieSpecialBanner } from "@/components/BookieSpecialBanner";
import { ScoringHelpBox } from "@/components/ScoringHelpBox";
import { TournamentPrizes } from "@/components/TournamentPrizes";
import {
  BRACKET_TAGLINE,
  BRACKET_TITLE,
  CAPTAIN_PICK_NAME,
  CAPTAIN_PICK_TAGLINE,
  SCORING_LOCK_LINE,
  SCORING_TIERS,
} from "@/lib/copy/banter";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=80";

export default async function HomePage() {
  const user = await getAuthUserFromRequest();
  const appHref = user ? "/dashboard" : "/auth";
  const headerLabel = user ? "My league" : "Sign in";
  const primaryCta = user ? "Get Your Picks In" : "Get Involved";
  const secondaryCta = user ? "Who's Chatting Rubbish?" : "Already in? Sign in";

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh]">
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

        <div className="relative mx-auto flex min-h-[85vh] max-w-4xl flex-col px-4 pb-16 pt-10 md:px-8">
          <BookieSpecialBanner />
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-7 w-7 text-gold-400" />
              <span className="font-bold tracking-tight">World Cup Predictions</span>
            </div>
            <Link
              href={appHref}
              className="hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/20 sm:inline-flex"
            >
              {headerLabel}
            </Link>
          </header>

          <div className="mt-auto pb-8">
            <div className="scoreboard-glow mb-6 inline-flex items-center gap-3 rounded-2xl border border-gold-400/30 bg-black/30 px-4 py-2 backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-400" />
              </span>
              <span className="text-sm font-semibold tracking-wide text-gold-400">
                FIFA WORLD CUP 2026
              </span>
            </div>

            <h1 className="mb-5 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl">
              Three competitions.
              <br />
              <span className="text-gold-400">Unlimited group chat abuse.</span>
            </h1>

            <p className="mb-8 max-w-xl text-lg text-white/75 md:text-xl">
              Back your football knowledge, stitch up your mates, and settle once
              and for all who actually knows ball.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={appHref}
                className="btn-primary group px-8 py-3.5 text-lg shadow-lg shadow-gold-500/20"
              >
                {primaryCta}
                <ChevronRight className="ml-1 h-5 w-5 transition group-hover:translate-x-0.5" />
              </Link>
              <Link href={user ? "/dashboard" : "/auth"} className="btn-secondary px-8 py-3.5 text-lg">
                {secondaryCta}
              </Link>
            </div>

            <p className="mt-5 flex items-center gap-2 text-sm text-white/50">
              <Timer className="h-4 w-4 shrink-0" />
              Predictions lock 15 minutes before kick-off
            </p>
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

      {/* How to join */}
      <section className="border-t border-white/10 bg-pitch-800 px-4 py-16 md:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold md:text-4xl">
            How to join
          </h2>
          <ol className="space-y-6">
            <JoinStep
              step={1}
              icon={<UserPlus className="h-6 w-6 text-gold-400" />}
              title="Lock in your account"
              text="Email, password, display name. Two minutes max, less time than arguing about VAR."
            />
            <JoinStep
              step={2}
              icon={<KeyRound className="h-6 w-6 text-gold-400" />}
              title="You're in the league"
              text="Sign in and you're automatically in the family league. No invite code drama."
            />
            <JoinStep
              step={3}
              icon={<Trophy className="h-6 w-6 text-gold-400" />}
              title="Get your picks in"
              text="Lock in scores, stick your house on one match per day, and have a guess at the knockout bracket."
            />
          </ol>
        </div>
      </section>

      {/* Three challenges */}
      <section className="relative bg-pitch-900 px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Three competitions</h2>
            <p className="mx-auto max-w-2xl text-white/60">
              Three ways to earn points. Play all three if you want to actually
              win, or just one if you enjoy the group chat meltdown.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <ChallengeCard
              icon={<Target className="h-6 w-6 text-gold-400" />}
              title="1. Score predictions"
              summary="Predict the full-time score for every match. Pub quiz rules apply."
              points={SCORING_TIERS.map(
                (t) => `${t.prediction}: ${t.points} pts (${t.label})`
              ).concat([SCORING_LOCK_LINE])}
            />
            <ChallengeCard
              icon={<Star className="h-6 w-6 text-gold-400" />}
              title={`2. ${CAPTAIN_PICK_NAME}`}
              summary={CAPTAIN_PICK_TAGLINE}
              points={[
                "One banker per matchday. Double points on that match.",
                "Exact score (5 pts) becomes 10 pts if your house bet lands",
                "Miss it and expect zero sympathy in the group chat",
                "Choose before the first match of the day kicks off",
              ]}
            />
            <ChallengeCard
              icon={<Crown className="h-6 w-6 text-gold-400" />}
              title={`3. ${BRACKET_TITLE}`}
              summary={BRACKET_TAGLINE}
              points={[
                `Lifts the trophy: ${BRACKET_POINTS.champion} pts`,
                `Runner-up: ${BRACKET_POINTS.runnerUp} pts`,
                `Each semi-finalist: ${BRACKET_POINTS.semiFinalist} pts`,
                "Submit by Saturday 13 June at midnight (UK time)",
                "Locks as soon as you save. No take-backs.",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Prizes */}
      <section className="border-t border-white/10 bg-pitch-800 px-4 py-16 md:px-8">
        <div className="mx-auto max-w-2xl">
          <TournamentPrizes />
        </div>
      </section>

      {/* Pub quiz rules */}
      <section className="border-t border-white/10 bg-pitch-800 px-4 py-16 md:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-center text-3xl font-bold md:text-4xl">
            The pub quiz rules
          </h2>
          <ScoringHelpBox defaultOpen />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-gradient-to-r from-pitch-800 to-pitch-900 px-4 py-16 md:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <Trophy className="mb-4 h-12 w-12 text-gold-400" />
          <h2 className="mb-3 text-2xl font-bold md:text-3xl">Right then. Kick-off.</h2>
          <p className="mb-8 max-w-lg text-white/65">
            {user
              ? "You're signed in. Get your picks in before someone screenshots the league table."
              : "Create your account and join the chaos. It's free, unlike your pint at half-time."}
          </p>
          <Link href={appHref} className="btn-primary px-10 py-3.5 text-lg">
            {user ? "Get Your Picks In" : "Get Involved"}
          </Link>
        </div>
      </section>
    </main>
  );
}

function JoinStep({
  step,
  icon,
  title,
  text,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <li className="card flex gap-4 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-lg font-bold text-gold-400">
        {step}
      </div>
      <div>
        <div className="mb-1 flex items-center gap-2">
          {icon}
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-white/65">{text}</p>
      </div>
    </li>
  );
}

function ChallengeCard({
  icon,
  title,
  summary,
  points,
}: {
  icon: React.ReactNode;
  title: string;
  summary: string;
  points: string[];
}) {
  return (
    <div className="card p-6">
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
  );
}
