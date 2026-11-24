import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { configDir, loadConfig, mask, readConfigFile, writeConfigValue } from '../src/config.ts';

let dir: string;
let path: string;
beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'longshelf-config-'));
	path = join(dir, 'longshelf', 'config.json');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('config', () => {
	it('uses XDG on Linux and Application Support on macOS', () => {
		expect(configDir({ XDG_CONFIG_HOME: '/x' }, 'linux')).toBe('/x/longshelf');
		expect(configDir({}, 'darwin')).toMatch(/Library\/Application Support\/longshelf$/);
	});

	it('writes values with mode 0600 and keeps the others', () => {
		writeConfigValue('url', 'https://library.example/', path);
		writeConfigValue('clientId', 'abc.access', path);
		expect(statSync(path).mode & 0o777).toBe(0o600);
		expect(readConfigFile(path)).toMatchObject({
			url: 'https://library.example/',
			clientId: 'abc.access'
		});
	});

	it('lets options beat environment variables, which beat the file', () => {
		writeFileSync(join(dir, 'c.json'), JSON.stringify({ url: 'https://file/', clientId: 'f' }));
		const c = loadConfig(
			{ clientId: 'opt' },
			{ LONGSHELF_URL: 'https://env/' },
			join(dir, 'c.json')
		);
		expect(c.url).toBe('https://env');
		expect(c.clientId).toBe('opt');
	});

	it('returns nothing for a missing file and masks secrets', () => {
		expect(readConfigFile(join(dir, 'none.json'))).toEqual({});
		expect(mask('0123456789')).toBe('****6789');
		expect(mask(undefined)).toBe('(not set)');
	});
});
