/**
 * Who is calling, from the Cloudflare Access token (spec 003 research R5, T003 spike result (a)).
 * Access sits in front of the Worker; this is the Worker's own fail-closed check, so turning
 * Access off by mistake exposes nothing (SC-004).
 *
 * - Owner: a valid token carrying `email` (the Access Allow policy decides who that is).
 * - CLI: a valid token with no email whose `common_name` is the configured service token id.
 *
 * Tokens are RS256 JWTs in `Cf-Access-Jwt-Assertion`, checked with WebCrypto against the team's
 * JWKS. No dependency.
 */

export type Identity = { kind: 'owner'; email: string } | { kind: 'cli' };

export interface AccessConfig {
	/** e.g. `myteam.cloudflareaccess.com` */
	teamDomain: string;
	/** The Access application's AUD tag. */
	aud: string;
	/** The service token's Client ID (`<hex>.access`). */
	cliClientId?: string;
}

interface Jwk extends JsonWebKey {
	kid: string;
}
type KeyFetcher = (teamDomain: string) => Promise<Jwk[]>;

const b64urlBytes = (s: string) =>
	Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const b64urlJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlBytes(s)));

/** Keys are cached per isolate for 10 minutes; Access rotates them rarely. */
let cache: { teamDomain: string; keys: Jwk[]; at: number } | null = null;
const KEY_TTL_MS = 10 * 60 * 1000;

export const fetchAccessKeys: KeyFetcher = async (teamDomain) => {
	if (cache && cache.teamDomain === teamDomain && Date.now() - cache.at < KEY_TTL_MS)
		return cache.keys;
	const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
	if (!res.ok) throw new Error(`Access keys: HTTP ${res.status}`);
	const { keys } = (await res.json()) as { keys: Jwk[] };
	cache = { teamDomain, keys, at: Date.now() };
	return keys;
};

/** The verified claims, or null for anything wrong: shape, signature, audience, issuer or time. */
export async function verifyAccessJwt(
	token: string,
	config: AccessConfig,
	fetchKeys: KeyFetcher = fetchAccessKeys,
	now = Date.now()
): Promise<Record<string, unknown> | null> {
	const parts = token.split('.');
	if (parts.length !== 3) return null;
	try {
		const header = b64urlJson(parts[0]) as { alg?: string; kid?: string };
		if (header.alg !== 'RS256' || !header.kid) return null;
		const jwk = (await fetchKeys(config.teamDomain)).find((k) => k.kid === header.kid);
		if (!jwk) return null;
		const key = await crypto.subtle.importKey(
			'jwk',
			jwk,
			{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
			false,
			['verify']
		);
		const ok = await crypto.subtle.verify(
			'RSASSA-PKCS1-v1_5',
			key,
			b64urlBytes(parts[2]),
			new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
		);
		if (!ok) return null;
		const claims = b64urlJson(parts[1]) as Record<string, unknown>;
		const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
		if (!aud.includes(config.aud)) return null;
		if (claims.iss !== `https://${config.teamDomain}`) return null;
		const seconds = now / 1000;
		if (typeof claims.exp !== 'number' || claims.exp <= seconds) return null;
		if (typeof claims.nbf === 'number' && claims.nbf > seconds + 60) return null;
		return claims;
	} catch {
		return null;
	}
}

/** Maps verified claims to an identity. */
export function identityFromClaims(
	claims: Record<string, unknown> | null,
	config: AccessConfig
): Identity | null {
	if (!claims) return null;
	if (typeof claims.email === 'string' && claims.email) return { kind: 'owner', email: claims.email };
	if (config.cliClientId && claims.common_name === config.cliClientId) return { kind: 'cli' };
	return null;
}

/** The caller of a request, or null when there is no valid Access token. */
export async function identityOf(
	request: Request,
	config: AccessConfig | null,
	fetchKeys: KeyFetcher = fetchAccessKeys
): Promise<Identity | null> {
	const token = request.headers.get('cf-access-jwt-assertion');
	if (!token || !config) return null;
	return identityFromClaims(await verifyAccessJwt(token, config, fetchKeys), config);
}

/** Access settings from Worker secrets, or null when any required one is missing. */
export function accessConfig(env: Partial<Record<string, unknown>>): AccessConfig | null {
	const teamDomain = env.ACCESS_TEAM_DOMAIN;
	const aud = env.ACCESS_AUD;
	if (typeof teamDomain !== 'string' || typeof aud !== 'string' || !teamDomain || !aud) return null;
	const cliClientId = typeof env.CLI_CLIENT_ID === 'string' ? env.CLI_CLIENT_ID : undefined;
	return { teamDomain, aud, cliClientId };
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Local runs only: `vite dev`, or the wrangler preview with `LONGSHELF_DEV_IDENTITY` set (e2e).
 * Never applies on a non-local hostname, so a stray variable in production does nothing.
 */
export function devIdentity(url: URL, isDev: boolean, env: Partial<Record<string, unknown>>) {
	if (!LOCAL_HOSTS.has(url.hostname)) return null;
	if (!isDev && env.LONGSHELF_DEV_IDENTITY !== '1') return null;
	return { kind: 'owner', email: 'dev@localhost' } as const satisfies Identity;
}
