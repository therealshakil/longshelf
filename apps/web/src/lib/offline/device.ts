/**
 * This device's identity for reading places (spec 004 FR-013, research R7): a random id made on
 * first use and a name the owner recognises, which they can change on the storage page. Kept in
 * localStorage; private mode gets an in-memory device for the visit. Never throws.
 */
export const DEVICE_KEY = 'longshelf.device.v1';

export interface Device {
	id: string;
	name: string;
}

/** A plain name from the browser's user agent. */
export function nameFromUserAgent(ua: string): string {
	if (/iPad/.test(ua)) return 'iPad';
	if (/iPhone|iPod/.test(ua)) return 'iPhone';
	if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
	if (/Macintosh|Mac OS X/.test(ua)) return 'Mac';
	if (/Windows/.test(ua)) return 'Windows PC';
	if (/CrOS/.test(ua)) return 'Chromebook';
	if (/Linux/.test(ua)) return 'Linux PC';
	return 'This browser';
}

let memory: Device | null = null;

function storage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

export function thisDevice(ua = globalThis.navigator?.userAgent ?? ''): Device {
	const store = storage();
	try {
		const raw = store?.getItem(DEVICE_KEY);
		if (raw) {
			const d = JSON.parse(raw) as Partial<Device>;
			if (typeof d.id === 'string' && d.id && typeof d.name === 'string' && d.name)
				return { id: d.id, name: d.name };
		}
	} catch {
		// Unreadable entry: make a new device below.
	}
	if (memory) return memory;
	const device = { id: crypto.randomUUID(), name: nameFromUserAgent(ua) };
	try {
		store?.setItem(DEVICE_KEY, JSON.stringify(device));
	} catch {
		// Storage unavailable: keep it for this visit.
	}
	memory = device;
	return device;
}

/** Rename this device. Empty or over-long names are refused; the name is trimmed. */
export function renameDevice(name: string): Device {
	const clean = name.trim().slice(0, 60);
	const device = { ...thisDevice(), name: clean || thisDevice().name };
	memory = device;
	try {
		storage()?.setItem(DEVICE_KEY, JSON.stringify(device));
	} catch {
		// Storage unavailable: the new name lasts for this visit.
	}
	return device;
}

/** For tests: forget the in-memory device. */
export function resetDeviceMemory() {
	memory = null;
}
