import type { Handle } from '@sveltejs/kit/hooks';
import localCalibre from 'virtual:longshelf/calibre';

/** With a local Calibre library, AI stays off so no book data leaves this machine (DR-0009). */
export const handle: Handle = ({ event, resolve }) =>
	localCalibre && event.url.pathname.startsWith('/api/ai/')
		? new Response('AI is off when running against a local Calibre library.', { status: 404 })
		: resolve(event);
