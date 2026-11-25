/**
 * Which books are downloaded on this device, for the ✓ on covers (spec 004 FR-005, approved mock
 * design-mocks/offline-states.html section 2). One shared set, refreshed whenever downloads
 * change, so tiles don't each read Cache Storage.
 */
import { downloads, list } from './downloads.ts';

let ids = $state<ReadonlySet<string>>(new Set());
let started = false;

async function refresh() {
	ids = new Set((await list()).map((e) => e.bookId));
}

/** Book ids on this device. Starts listening on first use, in the browser only. */
export function onDevice(): ReadonlySet<string> {
	if (!started && typeof window !== 'undefined' && 'caches' in window) {
		started = true;
		downloads.addEventListener('change', refresh);
		void refresh();
	}
	return ids;
}
