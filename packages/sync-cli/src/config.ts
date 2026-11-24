/**
 * The longshelf CLI configuration (specs/003-library-mirror/contracts/cli.md).
 * Priority: explicit option > LONGSHELF_* environment variable > config file > Calibre default.
 * The file holds the mirror URL and the Access service token, so it is written with mode 0600.
 */
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface LongshelfConfig {
	url?: string;
	clientId?: string;
	clientSecret?: string;
	library?: string;
}

export const CONFIG_KEYS = {
	url: 'url',
	'client-id': 'clientId',
	'client-secret': 'clientSecret',
	library: 'library'
} as const satisfies Record<string, keyof LongshelfConfig>;

/** The config folder for this OS (also holds the hash cache). */
export function configDir(env: NodeJS.ProcessEnv = process.env, platform = process.platform) {
	if (platform === 'darwin') return join(homedir(), 'Library/Application Support/longshelf');
	return join(env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'longshelf');
}

export const configPath = (env: NodeJS.ProcessEnv = process.env, platform = process.platform) =>
	join(configDir(env, platform), 'config.json');

export function readConfigFile(path = configPath()): LongshelfConfig {
	if (!existsSync(path)) return {};
	const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
	const text = (k: string) =>
		typeof raw[k] === 'string' && raw[k] ? (raw[k] as string) : undefined;
	return {
		url: text('url'),
		clientId: text('clientId'),
		clientSecret: text('clientSecret'),
		library: text('library')
	};
}

/** The file's values overlaid by LONGSHELF_* variables and explicit options. */
export function loadConfig(
	options: LongshelfConfig = {},
	env: NodeJS.ProcessEnv = process.env,
	path = configPath(env)
): LongshelfConfig {
	const file = readConfigFile(path);
	const pick = <K extends keyof LongshelfConfig>(key: K, envName: string) =>
		options[key] ?? (env[envName] || undefined) ?? file[key];
	return {
		url: pick('url', 'LONGSHELF_URL')?.replace(/\/+$/, ''),
		clientId: pick('clientId', 'LONGSHELF_CLIENT_ID'),
		clientSecret: pick('clientSecret', 'LONGSHELF_CLIENT_SECRET'),
		library: pick('library', 'LONGSHELF_CALIBRE_LIBRARY')
	};
}

export function writeConfigValue(key: keyof LongshelfConfig, value: string, path = configPath()) {
	const current = existsSync(path)
		? (JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>)
		: {};
	mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
	writeFileSync(path, JSON.stringify({ ...current, [key]: value }, null, 2) + '\n', {
		mode: 0o600
	});
	chmodSync(path, 0o600);
}

/** Secrets shown as ****1234. */
export const mask = (value: string | undefined) => (value ? `****${value.slice(-4)}` : '(not set)');

/**
 * Wrangler's variables for passing Cloudflare Access with the CLI's service token, used by dev
 * and the e2e preview for remote bindings (Workers AI). Empty when the caller already set them
 * or nothing is configured.
 */
export function accessEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
	if (env.CLOUDFLARE_ACCESS_CLIENT_ID) return {};
	const { clientId, clientSecret } = loadConfig({}, env);
	return clientId && clientSecret
		? { CLOUDFLARE_ACCESS_CLIENT_ID: clientId, CLOUDFLARE_ACCESS_CLIENT_SECRET: clientSecret }
		: {};
}
