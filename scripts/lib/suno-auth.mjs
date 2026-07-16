// Mints a fresh Suno Bearer JWT from a durable Clerk session cookie, for
// unattended (CI) use. Ported from the franklinbaldo/skills repo's
// suno-profile/scripts/mint-bearer-token.mjs — that version reads the
// cookie from Windows Credential Manager (interactive-session use); this
// one reads it from SUNO_CLERK_COOKIE (a GitHub Actions secret), since CI
// has no Windows keyring. Same underlying mechanism either way: GET
// https://auth.suno.com/v1/client with the cookie attached returns the
// current Clerk client, whose active session carries a fresh ~1h JWT.
const CLERK_API_VERSION = "2025-11-10";
const CLERK_JS_VERSION = "5.117.0";

export async function mintBearerToken(cookie = process.env.SUNO_CLERK_COOKIE) {
  if (!cookie) throw new Error("SUNO_CLERK_COOKIE is not set");
  const res = await fetch(
    `https://auth.suno.com/v1/client?__clerk_api_version=${CLERK_API_VERSION}&_clerk_js_version=${CLERK_JS_VERSION}`,
    { headers: { Cookie: `__client=${cookie}` } }
  );
  if (!res.ok) {
    throw new Error(
      `Clerk /v1/client returned ${res.status} — SUNO_CLERK_COOKIE may be stale, needs re-capture via suno-profile/scripts/login-and-capture.mjs`
    );
  }
  const body = await res.json();
  const session = body?.response?.sessions?.[0];
  const jwt = session?.last_active_token?.jwt;
  if (!jwt) {
    throw new Error("No active session/token in Clerk response — cookie may be invalid or expired.");
  }
  return jwt;
}
