import type { BookPage } from '@longshelf/shared/library';
import { library } from '#lib/library/index.ts';
import { entryFor, type DownloadEntry } from '#lib/offline/downloads.ts';
import type { PageLoad } from './$types';

export const ssr = false; // the reader runs in the browser only (foliate-js, local settings)

/** A book that has left the library but is still downloaded here opens by its saved title. */
const fromDownload = (e: DownloadEntry): BookPage => ({
	book: {
		id: e.bookId,
		title: e.title || 'Downloaded book',
		authors: [],
		tags: [],
		formats: [e.format],
		addedAt: e.savedAt.slice(0, 10)
	},
	positions: [],
	status: { kind: 'unread' },
	details: []
});

export const load: PageLoad = async ({ params }) => {
	const [found, fileUrl, entry] = await Promise.all([
		library.book(params.id).catch(() => null),
		library.bookFileUrl(params.id).catch(() => null),
		entryFor(params.id)
	]);
	// The device copy is read when there is one, online or offline, until the owner taps Update
	// (spec 004 FR-004, FR-007). The service worker serves it from Cache Storage.
	return {
		book: found ?? (entry ? fromDownload(entry) : null),
		fileUrl: entry?.fileUrl ?? fileUrl,
		downloaded: !!entry
	};
};
