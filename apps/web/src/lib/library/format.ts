import type { ReadingPosition } from '@longshelf/shared/library';

/** Plain-words relative time for "Last read": "Yesterday, 22:40", "12 days ago". */
export function lastReadLabel(iso: string, now = new Date()): string {
	const d = new Date(iso);
	const days = Math.floor((startOfDay(now) - startOfDay(d)) / 86_400_000);
	const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
	if (days <= 0) return `Today, ${time}`;
	if (days === 1) return `Yesterday, ${time}`;
	if (days < 7) return d.toLocaleDateString('en-GB', { weekday: 'long' }) + `, ${time}`;
	return `${days} days ago`;
}

/** Whole days since a position was last read on this device. */
export function daysAway(iso: string, now = new Date()): number {
	return Math.floor((startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000);
}

function startOfDay(d: Date): number {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** A file size in plain words: "240 KB", "1.2 MB". */
export function fileSize(bytes: number): string {
	if (bytes < 1000) return `${bytes} bytes`;
	const units = ['KB', 'MB', 'GB'];
	let v = bytes / 1000;
	let i = 0;
	while (v >= 1000 && i < units.length - 1) {
		v /= 1000;
		i++;
	}
	return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

export const DEVICE_NAMES: Record<string, string> = { kobo: 'Kobo', 'this-device': 'this device' };

/** The position on this device, and the other device's position if it differs. */
export function splitPositions(positions: ReadingPosition[]) {
	const here = positions.find((p) => p.source === 'this-device') ?? positions[0];
	const other = positions.find((p) => p !== here);
	return { here, other };
}

/** A device by its own name (spec 004 FR-013), Kobo as "Kobo", anything else by its id. */
export const deviceName = (p: Pick<ReadingPosition, 'source' | 'deviceName'>) =>
	p.deviceName ?? DEVICE_NAMES[p.source] ?? p.source;
