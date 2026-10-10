// Google ID-token verification (Sign in with Google) — zero-dependency,
// using Web Crypto + Google's JWKS. Returns null when unconfigured/invalid.

export type GoogleClaims = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
};

type GoogleJwk = {
  kid?: string;
  kty?: string;
  alg?: string;
  use?: string;
  n?: string;
  e?: string;
};

const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
let jwksCache: { keys: GoogleJwk[]; exp: number } | null = null;

function b64urlToStr(s: string): string {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b.length % 4 === 0 ? "" : "=".repeat(4 - (b.length % 4));
  return Buffer.from(b + pad, "base64").toString("utf8");
}

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b.length % 4 === 0 ? "" : "=".repeat(4 - (b.length % 4));
  return new Uint8Array(Buffer.from(b + pad, "base64").buffer as ArrayBuffer);
}

async function getJwks(): Promise<GoogleJwk[]> {
  if (jwksCache && jwksCache.exp > Date.now()) return jwksCache.keys;
  const res = await fetch(JWKS_URL, { cache: "no-store" });
  const data = (await res.json()) as { keys: GoogleJwk[] };
  jwksCache = { keys: data.keys || [], exp: Date.now() + 60 * 60 * 1000 };
  return jwksCache.keys;
}

export function googleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleClaims | null> {
  const clientId = googleClientId();
  if (!clientId) return null;
  const parts = credential.split(".");
  if (parts.length !== 3) return null;

  let header: { alg?: string; kid?: string };
  let payload: GoogleClaims & { aud?: string; iss?: string; exp?: number };
  try {
    header = JSON.parse(b64urlToStr(parts[0]));
    payload = JSON.parse(b64urlToStr(parts[1]));
  } catch {
    return null;
  }
  if (header.alg !== "RS256") return null;

  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const sig = b64urlToBytes(parts[2]);
  try {
    const keys = await getJwks();
    // Try the matching kid first, then fall back to every key
    const ordered = header.kid
      ? [...keys.filter((k) => k.kid === header.kid), ...keys.filter((k) => k.kid !== header.kid)]
      : keys;
    let ok = false;
    for (const jwk of ordered) {
      if (jwk.alg && jwk.alg !== "RS256") continue;
      const key = await crypto.subtle.importKey(
        "jwk", jwk as JsonWebKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"],
      );
      ok = await crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, key, sig, data);
      if (ok) break;
    }
    if (!ok) return null;
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") return null;
  if (payload.aud !== clientId) return null;
  if (!payload.exp || payload.exp < now) return null;
  if (!payload.sub) return null;
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}
