// Minimal types for the parts of foliate-js (vendor/foliate-js, pinned) that Ribbon uses.
export interface TocItem {
	label: string;
	href: string;
	subitems?: TocItem[];
}

export interface FoliateLocation {
	fraction: number;
	section?: { current: number; total: number };
	location?: { current: number; next: number; total: number };
	/** Minutes left: in this section, and in the book. */
	time?: { section: number; total: number };
	tocItem?: { label: string; href: string };
	cfi: string;
}

export interface FoliateRenderer extends HTMLElement {
	setStyles(css: string): void;
	next(): Promise<void>;
	prev(): Promise<void>;
}

export interface FoliateView extends HTMLElement {
	book: {
		toc?: TocItem[];
		metadata?: { title?: string };
		sections: { linear?: string; createDocument(): Promise<Document> }[];
		resolveHref?(href: string): { index: number; anchor(doc: Document): Element | number } | null;
	};
	renderer: FoliateRenderer;
	lastLocation?: FoliateLocation;
	open(file: string | Blob): Promise<void>;
	init(opts: { lastLocation?: string; showTextStart?: boolean }): Promise<void>;
	goTo(target: string): Promise<void>;
	goToFraction(fraction: number): Promise<void>;
	goLeft(): Promise<void>;
	goRight(): Promise<void>;
	close(): void;
}

/** What the reader route can do with an open book. */
export interface ReaderApi {
	toc: TocItem[];
	goTo(href: string): Promise<void>;
	goToFraction(fraction: number): Promise<void>;
}
