import type {
	AuthorPage,
	Book,
	BookPage,
	BookWithPositions,
	PeriodicalIssue,
	ReadingPosition,
	ReadStatus,
	Shelf,
	ShelfKind,
	ShelfSummary,
	SyncState,
	Author
} from './types.ts';

/**
 * The only way screens read library data (contracts/library-source.md).
 * SampleLibrary implements it now; the mirror-backed source implements it in spec 003.
 */
export interface LibrarySource {
	// Home
	/** Most recently read book on any source, or null when nothing is in progress. */
	current(): Promise<BookWithPositions | null>;
	/** In progress, newest first, excluding current. `alsoReading` returns at most 5. */
	alsoReading(limit: number): Promise<BookWithPositions[]>;
	/** Newest issue per publication. */
	latestPeriodicals(): Promise<PeriodicalIssue[]>;

	// Library
	/** Books only, never periodicals. */
	recentlyAdded(): Promise<{ thisWeek: Book[]; earlier: Book[] }>;
	/** Sorted by author sort. */
	authors(): Promise<{ author: Author; bookCount: number }[]>;
	author(id: string): Promise<AuthorPage | null>;
	shelves(kind: ShelfKind): Promise<ShelfSummary[]>;
	shelf(kind: ShelfKind, id: string, sort: 'title' | 'author' | 'added'): Promise<Shelf | null>;
	/** Title order ignoring The/A/An. */
	allBooks(): Promise<Book[]>;
	periodicals(): Promise<{ publication: string; frequency: string; issues: PeriodicalIssue[] }[]>;

	// Book and reader
	book(id: string): Promise<BookPage | null>;
	positions(bookId: string): Promise<ReadingPosition[]>;
	/** URL of the book file the reader opens (sample: static EPUB; 004: OPFS or R2). */
	bookFileUrl(bookId: string): Promise<string | null>;

	// Status everywhere
	status(bookId: string): Promise<ReadStatus>;
	syncStatus(): Promise<SyncState>;
}

export const ALSO_READING_MAX = 5;
