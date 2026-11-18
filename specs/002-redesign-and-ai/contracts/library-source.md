# Contract: LibrarySource

The only way screens read library data. `SampleLibrary` (this spec) and the mirror-backed source
(spec 003) both implement it. Types live in `packages/shared` (Zod, per CLAUDE.md), so the
server and client agree.

```ts
interface LibrarySource {
  // Home
  current(): Promise<BookWithPositions | null>;           // most recently read, any source
  alsoReading(limit: number): Promise<BookWithPositions[]>; // in progress, newest first, excluding current
  latestPeriodicals(): Promise<PeriodicalIssue[]>;         // newest issue per publication

  // Library
  recentlyAdded(): Promise<{ thisWeek: Book[]; earlier: Book[] }>; // books only, never periodicals
  authors(): Promise<{ author: Author; bookCount: number }[]>;     // sorted by author sort
  author(id: string): Promise<AuthorPage>;                          // books in library + bio/bibliography if known
  shelves(kind: 'collection' | 'genre'): Promise<ShelfSummary[]>;
  shelf(kind: 'collection' | 'genre', id: string, sort: 'title' | 'author' | 'added'): Promise<Shelf>;
  allBooks(): Promise<Book[]>;                                       // title order ignoring The/A/An
  periodicals(): Promise<{ publication: string; issues: PeriodicalIssue[] }[]>;

  // Book and reader
  book(id: string): Promise<BookPage>;
  positions(bookId: string): Promise<ReadingPosition[]>;
  bookFile(bookId: string): Promise<Blob>;                           // sample: static EPUB; 004: OPFS/R2

  // Status everywhere
  status(bookId: string): Promise<ReadStatus>;
  syncStatus(): Promise<{ state: 'up-to-date' | 'syncing' | 'offline' | 'attention'; lastSync?: string }>;
}
```

Rules:
- Every list returns real objects; no screen formats data a second way. `ReadStatus` text comes
  from one formatter (FR-005).
- `alsoReading` returns at most 5 (edge case: six or more in progress).
- Errors throw typed errors. Screens show the shared ErrorState component, never a raw message.
