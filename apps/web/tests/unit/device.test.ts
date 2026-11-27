import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	DEVICE_KEY,
	nameFromUserAgent,
	renameDevice,
	resetDeviceMemory,
	thisDevice
} from '#lib/offline/device.ts';
import { memoryStorage } from './memory-storage.ts';

const ANDROID =
	'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';

describe('nameFromUserAgent', () => {
	it.each([
		[ANDROID, 'Android phone'],
		[
			'Mozilla/5.0 (Linux; Android 15; SM-X710) AppleWebKit/537.36 Chrome/140.0 Safari/537.36',
			'Android tablet'
		],
		[
			'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
			'iPhone'
		],
		['Mozilla/5.0 (iPad; CPU OS 19_0 like Mac OS X) AppleWebKit/605.1.15', 'iPad'],
		['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15', 'Mac'],
		['Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0', 'Windows PC'],
		['Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0', 'Linux PC'],
		['curl/8.0', 'This browser']
	])('%s → %s', (ua, name) => {
		expect(nameFromUserAgent(ua)).toBe(name);
	});
});

describe('thisDevice', () => {
	beforeEach(() => {
		resetDeviceMemory();
		vi.stubGlobal('localStorage', memoryStorage());
	});
	afterEach(() => vi.unstubAllGlobals());

	it('creates a device once and keeps it', () => {
		const first = thisDevice(ANDROID);
		expect(first.name).toBe('Android phone');
		expect(first.id).toMatch(/^[0-9a-f-]{36}$/);
		resetDeviceMemory();
		expect(thisDevice(ANDROID)).toEqual(first);
		expect(JSON.parse(localStorage.getItem(DEVICE_KEY)!)).toEqual(first);
	});

	it('renames, trims, and ignores an empty name', () => {
		const d = thisDevice(ANDROID);
		expect(renameDevice('  Pixel  ')).toEqual({ id: d.id, name: 'Pixel' });
		expect(renameDevice('   ').name).toBe('Pixel');
		resetDeviceMemory();
		expect(thisDevice().name).toBe('Pixel');
	});

	it('works without storage, with one id for the visit', () => {
		vi.stubGlobal('localStorage', undefined);
		const a = thisDevice(ANDROID);
		expect(thisDevice(ANDROID).id).toBe(a.id);
	});
});
