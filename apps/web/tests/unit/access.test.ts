import { beforeAll, describe, expect, it } from 'vitest';
import {
	accessConfig,
	devIdentity,
	identityOf,
	verifyAccessJwt,
	type AccessConfig
} from '../../src/lib/server/mirror/access.ts';

const config: AccessConfig = {
	teamDomain: 'team.cloudflareaccess.com',
	aud: 'aud-tag',
	cliClientId: 'abc123.access'
};
const NOW = Math.floor(Date.now() / 1000);

let keys: { publicJwk: JsonWebKey & { kid: string }; privateKey: CryptoKey };
let otherPrivate: CryptoKey;

const b64url = (bytes: Uint8Array) =>
	btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
const enc = (v: unknown) => b64url(new TextEncoder().encode(JSON.stringify(v)));

async function sign(claims: Record<string, unknown>, key = keys.privateKey, kid = 'k1') {
	const head = `${enc({ alg: 'RS256', kid })}.${enc(claims)}`;
	const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head));
	return `${head}.${b64url(new Uint8Array(sig))}`;
}

const base = {
	aud: ['aud-tag'],
	iss: 'https://team.cloudflareaccess.com',
	iat: NOW - 10,
	nbf: NOW - 10,
	exp: NOW + 3600,
	type: 'app'
};
const fetchKeys = async () => [keys.publicJwk];
const request = (token?: string) =>
	new Request('https://library.example/', {
		headers: token ? { 'cf-access-jwt-assertion': token } : {}
	});

beforeAll(async () => {
	const gen = () =>
		crypto.subtle.generateKey(
			{
				name: 'RSASSA-PKCS1-v1_5',
				modulusLength: 2048,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: 'SHA-256'
			},
			true,
			['sign', 'verify']
		) as Promise<CryptoKeyPair>;
	const pair = await gen();
	const jwk = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey;
	keys = { publicJwk: { ...jwk, kid: 'k1' }, privateKey: pair.privateKey };
	otherPrivate = (await gen()).privateKey;
});

describe('Access identity', () => {
	it('is null without a token', async () => {
		expect(await identityOf(request(), config, fetchKeys)).toBeNull();
	});

	it('is the owner for a valid token with an email', async () => {
		const token = await sign({ ...base, email: 'owner@example.com' });
		expect(await identityOf(request(token), config, fetchKeys)).toEqual({
			kind: 'owner',
			email: 'owner@example.com'
		});
	});

	it('is the CLI for the configured service token', async () => {
		const token = await sign({ ...base, common_name: 'abc123.access' });
		expect(await identityOf(request(token), config, fetchKeys)).toEqual({ kind: 'cli' });
	});

	it('is null for an unknown service token', async () => {
		const token = await sign({ ...base, common_name: 'other.access' });
		expect(await identityOf(request(token), config, fetchKeys)).toBeNull();
	});

	it('rejects a bad signature, wrong audience, wrong issuer and expiry', async () => {
		const email = { email: 'owner@example.com' };
		const check = (t: string) => verifyAccessJwt(t, config, fetchKeys, NOW * 1000);
		expect(await check(await sign({ ...base, ...email }, otherPrivate))).toBeNull();
		expect(await check(await sign({ ...base, ...email, aud: ['other'] }))).toBeNull();
		expect(await check(await sign({ ...base, ...email, iss: 'https://evil' }))).toBeNull();
		expect(await check(await sign({ ...base, ...email, exp: NOW - 1 }))).toBeNull();
		expect(await check(await sign({ ...base, ...email }, keys.privateKey, 'k2'))).toBeNull();
		expect(await check('not.a.jwt')).toBeNull();
		expect(await check(await sign({ ...base, ...email }))).not.toBeNull();
	});

	it('is null when Access settings are missing', async () => {
		const token = await sign({ ...base, email: 'owner@example.com' });
		expect(accessConfig({})).toBeNull();
		expect(await identityOf(request(token), null, fetchKeys)).toBeNull();
	});
});

describe('dev identity', () => {
	it('applies only on a local host in dev or with the preview flag', () => {
		const local = new URL('http://127.0.0.1:4173/');
		const remote = new URL('https://library.example/');
		expect(devIdentity(local, true, {})).not.toBeNull();
		expect(devIdentity(local, false, {})).toBeNull();
		expect(devIdentity(local, false, { LONGSHELF_DEV_IDENTITY: '1' })).not.toBeNull();
		expect(devIdentity(remote, true, { LONGSHELF_DEV_IDENTITY: '1' })).toBeNull();
	});
});
