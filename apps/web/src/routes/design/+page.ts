import { redirect } from '@sveltejs/kit';
import { LAST_PAGE_KEY } from '#lib/catalogue/entries.ts';

// Runs in the browser only, so it can read the remembered page before anything renders.
export const ssr = false;

export function load() {
	let last: string | null = null;
	try {
		last = localStorage.getItem(LAST_PAGE_KEY);
	} catch {
		// Storage unavailable: fall through to the About page.
	}
	redirect(307, last?.startsWith('/design/') ? last : '/design/about');
}
