/** Legacy demo fixture id — excluded from matches and scoring. */
export const LEGACY_DEMO_MATCH_ID = "999000001";

/** Only this email can create new leagues. */
export const LEAGUE_ADMIN_EMAIL = "abdouu2005@gmail.com";

/** Invite code for the main family league (World Cup 2026). */
export function getMainLeagueInviteCode(): string {
  return process.env.MAIN_LEAGUE_INVITE_CODE?.trim() || "LADLL8";
}

export function isLeagueAdmin(email: string | undefined | null): boolean {
  return email?.toLowerCase() === LEAGUE_ADMIN_EMAIL.toLowerCase();
}
