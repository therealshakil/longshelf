/**
 * SampleLibrary: the licence-free library the screens run on until the mirror exists
 * (spec 002 FR-007, research R1). Titles, authors and covers are Standard Ebooks
 * (public domain, https://standardebooks.org/about). Collections, progress, dates, bios
 * and periodicals are invented to match the approved mocks in design-mocks/.
 */
import raw from './books.json' with { type: 'json' };
import type { LibrarySource } from '../library/source.ts';
import { ALSO_READING_MAX } from '../library/source.ts';
import { statusFrom, titleSortKey } from '../library/status.ts';
import type {
	Author,
	AuthorPage,
	Book,
	BookPage,
	BookWithPositions,
	PeriodicalIssue,
	ReadingPosition,
	ShelfKind,
	ShelfSummary
} from '../library/types.ts';

interface RawBook {
	slug: string;
	title: string;
	author: string;
	url: string;
}

const SINGLE_NAMES = new Set(['Homer', 'Plato', 'Laozi', 'Seneca', 'Epictetus', 'Boethius']);

export function authorSort(name: string): string {
	if (SINGLE_NAMES.has(name) || name === 'Sun Tzu' || name === 'Gregory of Nyssa') return name;
	if (name.startsWith('Miguel de Cervantes')) return 'Cervantes, Miguel de';
	if (name === 'Dante Alighieri') return 'Alighieri, Dante';
	const w = name.split(' ');
	return `${w.at(-1)}, ${w.slice(0, -1).join(' ')}`;
}

const authorId = (name: string) =>
	name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');

const COLLECTIONS: Record<string, string[]> = {
	'Reading List': [
		'virginia-woolf_mrs-dalloway',
		'charlotte-bronte_jane-eyre',
		'leo-tolstoy_war-and-peace_louise-maude_aylmer-maude',
		'miguel-de-cervantes-saavedra_don-quixote_john-ormsby',
		'virginia-woolf_to-the-lighthouse',
		'marcel-proust_in-search-of-lost-time_c-k-scott-moncrieff'
	],
	Gothic: [
		'bram-stoker_dracula',
		'mary-shelley_frankenstein',
		'emily-bronte_wuthering-heights',
		'robert-w-chambers_the-king-in-yellow',
		'robert-louis-stevenson_the-strange-case-of-dr-jekyll-and-mr-hyde',
		'oscar-wilde_the-picture-of-dorian-gray',
		'edgar-allan-poe_short-fiction'
	],
	'Russian novels': [
		'fyodor-dostoevsky_crime-and-punishment_constance-garnett',
		'fyodor-dostoevsky_the-brothers-karamazov_constance-garnett',
		'leo-tolstoy_anna-karenina_constance-garnett',
		'fyodor-dostoevsky_the-idiot_eva-m-martin',
		'fyodor-dostoevsky_notes-from-underground_constance-garnett'
	],
	Stoics: [
		'marcus-aurelius_meditations_george-long',
		'seneca_moral-letters-to-lucilius_richard-m-gummere',
		'epictetus_discourses_george-long',
		'epictetus_short-works_george-long',
		'seneca_dialogues_aubrey-stewart'
	],
	'Detective fiction': [
		'arthur-conan-doyle_the-adventures-of-sherlock-holmes',
		'arthur-conan-doyle_the-hound-of-the-baskervilles',
		'agatha-christie_the-murder-of-roger-ackroyd',
		'agatha-christie_the-mysterious-affair-at-styles',
		'arthur-conan-doyle_a-study-in-scarlet',
		'a-e-w-mason_the-house-of-the-arrow'
	],
	'Poetry & drama': [
		'homer_the-odyssey_william-cullen-bryant',
		'homer_the-iliad_william-cullen-bryant',
		'john-milton_paradise-lost',
		'william-shakespeare_hamlet',
		'william-shakespeare_macbeth',
		'dante-alighieri_the-divine-comedy_henry-wadsworth-longfellow'
	]
};

const DESCRIPTIONS: Record<string, string> = {
	'george-eliot_middlemarch':
		'In the Midlands town of Middlemarch around 1830, the idealistic Dorothea Brooke marries the elderly scholar Edward Casaubon, hoping to share in great work, and the ambitious young doctor Tertius Lydgate arrives with plans to reform medicine.\n\nTheir lives cross with a whole town’s worth of neighbours, debts and hopes, set against the Reform Act and the coming of the railway.'
};

const SUBTITLES: Record<string, string> = {
	'george-eliot_middlemarch': 'A Study of Provincial Life'
};

const PUB_YEARS: Record<string, string> = { 'george-eliot_middlemarch': '1871–72' };

/** Books with a public-domain EPUB in static/sample/books (Project Gutenberg; see its README). */
const EPUBS = new Set([
	'george-eliot_middlemarch',
	'herman-melville_moby-dick',
	'bram-stoker_dracula',
	'robert-w-chambers_the-king-in-yellow',
	'john-milton_paradise-lost'
]);

const FINISHED = [
	'mary-shelley_frankenstein',
	'f-scott-fitzgerald_the-great-gatsby',
	'jane-austen_pride-and-prejudice',
	'fyodor-dostoevsky_crime-and-punishment_constance-garnett',
	'h-g-wells_the-time-machine',
	'bram-stoker_dracula',
	'oscar-wilde_the-picture-of-dorian-gray',
	'henry-david-thoreau_walden',
	'agatha-christie_the-murder-of-roger-ackroyd'
];

interface Progress {
	slug: string;
	percent: number;
	chapter: string;
	href: string;
	/** Hours since last read on this device. */
	hoursAgo: number;
	kobo?: number;
}

const IN_PROGRESS: Progress[] = [
	{
		slug: 'george-eliot_middlemarch',
		percent: 38,
		chapter: 'Book IV, Chapter 40',
		href: 'chapter-40',
		hoursAgo: 13,
		kobo: 41
	},
	{
		slug: 'leo-tolstoy_anna-karenina_constance-garnett',
		percent: 71,
		chapter: 'Part Six, Chapter 12',
		href: 'chapter-6-12',
		hoursAgo: 40,
		kobo: 64
	},
	{
		slug: 'herman-melville_moby-dick',
		percent: 12,
		chapter: 'Chapter 23',
		// A real contents link: Story so far locates the place from it.
		href: 'OEBPS/8951984864809045623_2701-h-2.htm.xhtml#pgepubid00027',
		hoursAgo: 12 * 24 + 3
	},
	{
		slug: 'marcus-aurelius_meditations_george-long',
		percent: 55,
		chapter: 'Book Five',
		href: 'book-5',
		hoursAgo: 60,
		kobo: 55
	}
];

const PERIODICALS: { publication: string; frequency: PeriodicalIssue['frequency']; issues: string[]; readCount: number }[] = [
	{ publication: 'The Evening Courier', frequency: 'daily', issues: ['Sat 14 Nov', 'Fri 13 Nov', 'Thu 12 Nov', 'Wed 11 Nov', 'Tue 10 Nov'], readCount: 1 },
	{ publication: 'Harbour Weekly', frequency: 'weekly', issues: ['14 Nov', '7 Nov', '31 Oct', '24 Oct'], readCount: 2 },
	{ publication: 'The Garden Gazette', frequency: 'weekly', issues: ['14 Nov', '7 Nov', '31 Oct'], readCount: 3 },
	{ publication: 'The Literary Supplement', frequency: 'weekly', issues: ['14 Nov', '7 Nov', '31 Oct', '24 Oct'], readCount: 2 },
	{ publication: 'The Northern Review', frequency: 'monthly', issues: ['November', 'October', 'September'], readCount: 1 },
	{ publication: 'Field & Shore', frequency: 'monthly', issues: ['November', 'October', 'September'], readCount: 1 },
	{ publication: 'Science Monthly', frequency: 'monthly', issues: ['November', 'October'], readCount: 0 }
];

const AUTHOR_EXTRAS: Record<string, Partial<Author>> = {
	'jane-austen': {
		lifeDates: '1775–1817 · English novelist',
		bio: {
			text: 'Born at Steventon, Hampshire, the daughter of a clergyman. Her six novels, the first four published anonymously “By a Lady”, follow the marriages, money and manners of the English landed gentry with sharp irony. She died in Winchester at 41; Northanger Abbey and Persuasion appeared after her death.',
			source: 'https://en.wikipedia.org/wiki/Jane_Austen'
		},
		portrait: {
			url: '/sample/authors/jane-austen.jpg',
			credit: 'Sketch by Cassandra Austen, about 1810',
			licence: 'Public domain (Wikimedia Commons)',
			alt: 'Pencil and watercolour sketch of Jane Austen'
		},
		bibliography: [
			{ title: 'Sense and Sensibility', year: '1811', ownedBookId: 'jane-austen_sense-and-sensibility' },
			{ title: 'Pride and Prejudice', year: '1813', ownedBookId: 'jane-austen_pride-and-prejudice' },
			{ title: 'Mansfield Park', year: '1814' },
			{ title: 'Emma', year: '1815', ownedBookId: 'jane-austen_emma' },
			{ title: 'Northanger Abbey', year: '1817' },
			{ title: 'Persuasion', year: '1817', ownedBookId: 'jane-austen_persuasion' },
			{ title: 'Lady Susan', year: '1871' }
		]
	}
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export interface SampleOptions {
	/** "Now" for relative dates. Defaults to the current time. */
	now?: Date;
	/** Base URL for covers and books (default `/sample`). */
	assetBase?: string;
}

export function createSampleLibrary(opts: SampleOptions = {}): LibrarySource {
	const now = opts.now ?? new Date();
	const base = opts.assetBase ?? '/sample';
	const inCollection = new Map<string, string>();
	for (const [name, slugs] of Object.entries(COLLECTIONS)) for (const s of slugs) inCollection.set(s, name);

	const books: Book[] = (raw as RawBook[]).map((b, i) => ({
		id: b.slug,
		title: b.title,
		subtitle: SUBTITLES[b.slug],
		authors: [{ id: authorId(b.author), name: b.author, sort: authorSort(b.author) }],
		cover: { url: `${base}/covers/${b.slug}.jpg`, alt: `Cover of ${b.title}` },
		description: DESCRIPTIONS[b.slug],
		collection: inCollection.get(b.slug),
		tags: ['Fiction'],
		formats: ['EPUB'],
		// Spread "date added" back from today: newest first in the source order.
		addedAt: isoDate(new Date(now.getTime() - (Math.floor(i / 2) + 1) * DAY)),
		pubYear: PUB_YEARS[b.slug],
		publisher: 'Standard Ebooks'
	}));
	const byId = new Map(books.map((b) => [b.id, b]));

	const positions = new Map<string, ReadingPosition[]>();
	for (const p of IN_PROGRESS) {
		const readAt = new Date(now.getTime() - p.hoursAgo * HOUR).toISOString();
		const list: ReadingPosition[] = [
			{
				bookId: p.slug,
				source: 'this-device',
				percent: p.percent,
				chapterLabel: p.chapter,
				href: p.href,
				fraction: 0.4,
				readAt,
				furthestHref: p.href,
				furthestPercent: p.percent
			}
		];
		if (p.kobo !== undefined)
			list.push({
				bookId: p.slug,
				source: 'kobo',
				percent: p.kobo,
				chapterLabel: p.chapter,
				href: p.href,
				fraction: 0.6,
				readAt: new Date(now.getTime() - (p.hoursAgo + 20) * HOUR).toISOString(),
				furthestHref: p.href,
				furthestPercent: p.kobo
			});
		positions.set(p.slug, list);
	}
	for (const slug of FINISHED)
		positions.set(slug, [
			{
				bookId: slug,
				source: 'this-device',
				percent: 100,
				chapterLabel: 'The end',
				href: 'end',
				fraction: 1,
				readAt: new Date(now.getTime() - 20 * DAY).toISOString(),
				furthestHref: 'end',
				furthestPercent: 100
			}
		]);

	const withPositions = (book: Book): BookWithPositions => {
		const ps = [...(positions.get(book.id) ?? [])].sort((a, b) => b.readAt.localeCompare(a.readAt));
		return { book, positions: ps, status: statusFrom(ps) };
	};

	const inProgress = () =>
		books
			.map(withPositions)
			.filter((b) => b.status.kind === 'in-progress')
			.sort((a, b) => b.positions[0].readAt.localeCompare(a.positions[0].readAt));

	const byTitle = (a: Book, b: Book) => titleSortKey(a.title).localeCompare(titleSortKey(b.title));
	const byAuthor = (a: Book, b: Book) =>
		a.authors[0].sort.localeCompare(b.authors[0].sort) || byTitle(a, b);

	const authorsMap = new Map<string, Author>();
	for (const b of books) {
		const a = b.authors[0];
		if (!authorsMap.has(a.id))
			authorsMap.set(a.id, { ...a, bibliography: [], ...AUTHOR_EXTRAS[a.id] });
	}

	const periodicalIssues = PERIODICALS.map((p) => ({
		publication: p.publication,
		frequency: p.frequency,
		issues: p.issues.map((label, i): PeriodicalIssue => {
			const read = i > 0 && i <= p.readCount;
			return {
				id: `${authorId(p.publication)}-${i}`,
				publication: p.publication,
				issueDate: isoDate(new Date(now.getTime() - (i + 4) * DAY)),
				issueLabel: label,
				frequency: p.frequency,
				status: i === 0 && p.readCount > 0 ? 'new' : read ? (i === 1 ? 'in-progress' : 'finished') : 'unread',
				percent: read && i === 1 ? 40 : undefined
			};
		})
	}));

	const shelfSummary = (name: string, list: Book[]): ShelfSummary => ({
		kind: 'collection',
		id: authorId(name),
		name,
		count: list.length,
		sample: list.slice(0, 3)
	});

	return {
		async current() {
			return inProgress()[0] ?? null;
		},
		async alsoReading(limit) {
			return inProgress().slice(1, 1 + Math.min(limit, ALSO_READING_MAX));
		},
		async latestPeriodicals() {
			return periodicalIssues.map((p) => p.issues[0]);
		},
		async recentlyAdded() {
			const sorted = [...books].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
			const weekAgo = isoDate(new Date(now.getTime() - 7 * DAY));
			return {
				thisWeek: sorted.filter((b) => b.addedAt > weekAgo),
				earlier: sorted.filter((b) => b.addedAt <= weekAgo).slice(0, 12)
			};
		},
		async authors() {
			const counts = new Map<string, number>();
			for (const b of books) counts.set(b.authors[0].id, (counts.get(b.authors[0].id) ?? 0) + 1);
			return [...authorsMap.values()]
				.sort((a, b) => a.sort.localeCompare(b.sort))
				.map((author) => ({ author, bookCount: counts.get(author.id) ?? 0 }));
		},
		async author(id) {
			const author = authorsMap.get(id);
			if (!author) return null;
			const list = books.filter((b) => b.authors[0].id === id).sort(byTitle).map(withPositions);
			return { author, books: list, finishedCount: list.filter((b) => b.status.kind === 'finished').length };
		},
		async shelves(kind: ShelfKind) {
			if (kind === 'genre') return []; // AI genres arrive with US6
			return Object.entries(COLLECTIONS)
				.map(([name, slugs]) => shelfSummary(name, slugs.map((s) => byId.get(s)).filter((b): b is Book => !!b)))
				.sort((a, b) => b.count - a.count);
		},
		async shelf(kind, id, sort) {
			if (kind === 'genre') return null;
			const entry = Object.entries(COLLECTIONS).find(([name]) => authorId(name) === id);
			if (!entry) return null;
			const list = entry[1].map((s) => byId.get(s)).filter((b): b is Book => !!b);
			const order =
				sort === 'author' ? byAuthor : sort === 'added' ? (a: Book, b: Book) => b.addedAt.localeCompare(a.addedAt) : byTitle;
			list.sort(order);
			return { ...shelfSummary(entry[0], list), books: list };
		},
		async allBooks() {
			return [...books].sort(byTitle);
		},
		async periodicals() {
			return periodicalIssues;
		},
		async book(id): Promise<BookPage | null> {
			const book = byId.get(id);
			if (!book) return null;
			const details = [
				{ label: 'Collection', value: book.collection ?? 'None' },
				{ label: 'Added', value: new Date(book.addedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
				{ label: 'Publisher', value: book.publisher ?? 'Unknown' },
				{ label: 'Tags', value: book.tags.join(', ') || 'None' }
			];
			return { ...withPositions(book), details };
		},
		async positions(bookId) {
			return withPositions(byId.get(bookId) ?? books[0]).positions;
		},
		async bookFileUrl(bookId) {
			return EPUBS.has(bookId) ? `${base}/books/${bookId}.epub` : null;
		},
		async status(bookId) {
			const book = byId.get(bookId);
			return book ? withPositions(book).status : { kind: 'unread' };
		},
		async syncStatus() {
			return { state: 'up-to-date', lastSync: new Date(now.getTime() - 4 * 60_000).toISOString() };
		}
	};
}
