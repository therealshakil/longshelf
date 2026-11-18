import type { ReadingPosition } from '@ribbon/shared/library';

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

export const DEVICE_NAMES: Record<string, string> = { kobo: 'Kobo', 'this-device': 'this device' };

/** The position on this device, and the other device's position if it differs. */
export function splitPositions(positions: ReadingPosition[]) {
	const here = positions.find((p) => p.source === 'this-device') ?? positions[0];
	const other = positions.find((p) => p !== here);
	return { here, other };
}

/** Kobo shown as "Kobo"; anything else by its id. */
export const deviceName = (source: string) => DEVICE_NAMES[source] ?? source;
