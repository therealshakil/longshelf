import type { LibrarySource } from './source.ts';
import { ALSO_READING_MAX } from './source.ts';
import { bookSortKey } from './status.ts';
import type {
	Author,
	AuthorRef,
	Book,
	BookPage,
	BookWithPositions,
	PeriodicalIssue,
	ShelfKind,
	ShelfSummary
} from './types.ts';

/** A read-only copy of a library's metadata (DR-0009). It carries no reading progress yet. */
export interface LibrarySnapshot {
	/** ISO time the snapshot was read. */
	readAt: string;
	books: Book[];
	/** Calibre news downloads, kept apart from books. */
	news: Book[];
}

export interface SnapshotOptions {
	now?: Date;
	/** URL of a book's readable file, or null when it has none. */
	fileUrl: (book: Book) => string | null;
}

const DAY = 86_400_000;
const slug = (name: string) =>
	name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');

const byTitle = (a: Book, b: Book) => bookSortKey(a).localeCompare(bookSortKey(b));
const byAuthor = (a: Book, b: Book) =>
	(a.authors[0]?.sort ?? '').localeCompare(b.authors[0]?.sort ?? '') || byTitle(a, b);
const byAdded = (a: Book, b: Book) => b.addedAt.localeCompare(a.addedAt);
const unread = (book: Book): BookWithPositions => ({
	book,
	positions: [],
	status: { kind: 'unread' }
});

/** "The Paper [Sat, 14 Nov 2026]" becomes its publication and issue label. */
export function parseIssueTitle(title: string): { publication: string; label: string } {
	const m = /^(.*?)\s*\[([^\]]+)\]\s*$/.exec(title);
	return m ? { publication: m[1], label: m[2] } : { publication: title, label: title };
}

function frequencyOf(issues: PeriodicalIssue[]): PeriodicalIssue['frequency'] {
	if (issues.length < 2) return 'weekly';
	const times = issues.map((i) => Date.parse(i.issueDate));
	const gap = (Math.max(...times) - Math.min(...times)) / (issues.length - 1) / DAY;
	return gap <= 2 ? 'daily' : gap <= 10 ? 'weekly' : 'monthly';
}

export function createSnapshotLibrary(
	snapshot: LibrarySnapshot,
	{ now = new Date(), fileUrl }: SnapshotOptions
): LibrarySource {
	const { books, news } = snapshot;
	const byId = new Map([...books, ...news].map((b) => [b.id, b]));

	const authorRefs = new Map<string, AuthorRef>();
	const authorBooks = new Map<string, Book[]>();
	for (const b of books)
		for (const a of b.authors) {
			authorRefs.set(a.id, a);
			authorBooks.set(a.id, [...(authorBooks.get(a.id) ?? []), b]);
		}
	const toAuthor = (a: AuthorRef): Author => ({ ...a, bibliography: [] });

	const collections = new Map<string, { name: string; books: Book[] }>();
	for (const b of books) {
		if (!b.collection) continue;
		const id = slug(b.collection) || b.collection;
		const entry = collections.get(id) ?? { name: b.collection, books: [] };
		entry.books.push(b);
		collections.set(id, entry);
	}
	const summary = (id: string, name: string, list: Book[]): ShelfSummary => ({
		kind: 'collection',
		id,
		name,
		count: list.length,
		sample: list.slice(0, 3)
	});

	const publications = new Map<string, PeriodicalIssue[]>();
	for (const b of [...news].sort(byAdded)) {
		const { publication, label } = parseIssueTitle(b.title);
		const issue: PeriodicalIssue = {
			id: b.id,
			publication,
			issueDate: b.addedAt,
			issueLabel: label,
			frequency: 'weekly',
			status: 'unread',
			cover: b.cover
		};
		publications.set(publication, [...(publications.get(publication) ?? []), issue]);
	}
	const periodicals = [...publications].map(([publication, list]) => {
		const frequency = frequencyOf(list);
		return { publication, frequency, issues: list.map((i) => ({ ...i, frequency })) };
	});

	return {
		async current() {
			return null;
		},
		async alsoReading(limit) {
			return [].slice(0, Math.min(limit, ALSO_READING_MAX));
		},
		async latestPeriodicals() {
			return periodicals.map((p) => p.issues[0]);
		},
		async recentlyAdded() {
			const sorted = [...books].sort(byAdded);
			const weekAgo = new Date(now.getTime() - 7 * DAY).toISOString().slice(0, 10);
			return {
				thisWeek: sorted.filter((b) => b.addedAt > weekAgo),
				earlier: sorted.filter((b) => b.addedAt <= weekAgo).slice(0, 12)
			};
		},
		async authors() {
			return [...authorRefs.values()]
				.sort((a, b) => a.sort.localeCompare(b.sort))
				.map((a) => ({ author: toAuthor(a), bookCount: authorBooks.get(a.id)?.length ?? 0 }));
		},
		async author(id) {
			const ref = authorRefs.get(id);
			if (!ref) return null;
			const list = [...(authorBooks.get(id) ?? [])].sort(byTitle).map(unread);
			return { author: toAuthor(ref), books: list, finishedCount: 0 };
		},
		async shelves(kind: ShelfKind) {
			if (kind === 'genre') return [];
			return [...collections]
				.map(([id, c]) => summary(id, c.name, c.books))
				.sort((a, b) => b.count - a.count);
		},
		async shelf(kind, id, sort) {
			if (kind === 'genre') return null;
			const entry = collections.get(id);
			if (!entry) return null;
			const order = sort === 'author' ? byAuthor : sort === 'added' ? byAdded : byTitle;
			const list = [...entry.books].sort(order);
			return { ...summary(id, entry.name, list), books: list };
		},
		async allBooks() {
			return [...books].sort(byTitle);
		},
		async periodicals() {
			return periodicals;
		},
		async book(id): Promise<BookPage | null> {
			const book = byId.get(id);
			if (!book) return null;
			const added = new Date(book.addedAt).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
			return {
				...unread(book),
				details: [
					{ label: 'Collection', value: book.collection ?? 'None' },
					{ label: 'Added', value: added },
					{ label: 'Publisher', value: book.publisher ?? 'Unknown' },
					{ label: 'Tags', value: book.tags.join(', ') || 'None' }
				]
			};
		},
		async positions() {
			return [];
		},
		async bookFileUrl(id) {
			const book = byId.get(id);
			return book ? fileUrl(book) : null;
		},
		async status() {
			return { kind: 'unread' };
		},
		async syncStatus() {
			return { state: 'up-to-date', lastSync: snapshot.readAt };
		}
	};
}
