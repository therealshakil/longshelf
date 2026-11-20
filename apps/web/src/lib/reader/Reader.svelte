<!--
	The one wrapper around foliate-js (CLAUDE.md stack, research R2). It opens a book, applies the
	text settings, reports where you are, and reports taps by zone: the middle third toggles the
	bars, the edges turn pages in page mode.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { FoliateLocation, FoliateView, ReaderApi } from './foliate.d.ts';
	import { bookCss, readColours } from './reader-styles.ts';
	import type { ReaderSettings } from './settings.ts';

	let {
		src,
		settings,
		themeKey,
		startCfi,
		startFraction,
		onReady,
		onRelocate,
		onChapterFinished,
		onTap,
		onKey,
		onError
	}: {
		src: string;
		settings: ReaderSettings;
		/** Changes when the theme changes, so colours are re-read. */
		themeKey: string;
		startCfi?: string;
		startFraction?: number;
		onReady?: (api: ReaderApi) => void;
		onRelocate?: (loc: FoliateLocation) => void;
		/**
		 * A chapter (contents entry) was left for the next one, so the owner finished it (US4). The
		 * text is handed over once for summarising; Ribbon doesn't keep it.
		 */
		onChapterFinished?: (chapter: {
			href: string;
			ordinal: number;
			label: string;
			text: string;
		}) => void;
		onTap?: (zone: 'left' | 'middle' | 'right') => void;
		/** A key pressed while focus is inside the book (forwarded so page keys work there too). */
		onKey?: (e: KeyboardEvent) => void;
		onError?: (message: string) => void;
	} = $props();

	let hostEl = $state<HTMLDivElement>();
	let view: FoliateView | null = null;
	let flatToc: { href: string; label: string }[] = [];
	let lastOrdinal = -1;

	const flatten = (
		items: { href: string; label: string; subitems?: unknown[] }[]
	): typeof flatToc =>
		items.flatMap((i) => [
			{ href: i.href, label: i.label.trim() },
			...flatten((i.subitems ?? []) as typeof items)
		]);

	/** The text of contents entry `ordinal`: from its anchor up to the next entry's anchor. */
	async function chapterText(ordinal: number): Promise<string> {
		const book = view?.book;
		const here = book?.resolveHref?.(flatToc[ordinal].href);
		if (!book || !here) return '';
		const doc = await book.sections[here.index].createDocument();
		const range = doc.createRange();
		const start = here.anchor(doc);
		if (start instanceof Element) range.setStartBefore(start);
		else range.setStart(doc.body, 0);
		range.setEndAfter(doc.body.lastChild ?? doc.body);
		const next = flatToc[ordinal + 1] && book.resolveHref?.(flatToc[ordinal + 1].href);
		if (next && next.index === here.index) {
			const end = next.anchor(doc);
			if (end instanceof Element) range.setEndBefore(end);
		}
		return range.toString().replace(/\s+/g, ' ').trim();
	}

	async function finished(ordinal: number) {
		try {
			const text = await chapterText(ordinal);
			const { href, label } = flatToc[ordinal];
			onChapterFinished?.({ href, ordinal, label, text });
		} catch {
			// A chapter that can't be read just goes without a summary.
		}
	}

	function applyStyles() {
		if (!view?.renderer) return;
		view.renderer.setStyles(bookCss(settings, readColours(), location.origin));
		view.renderer.setAttribute('flow', settings.page === 'pages' ? 'paginated' : 'scrolled');
		view.renderer.setAttribute('max-inline-size', '720px');
		view.renderer.setAttribute('gap', '6%');
	}

	$effect(() => {
		// Re-apply whenever settings or theme change.
		void settings.size;
		void settings.font;
		void settings.spacing;
		void settings.margins;
		void settings.page;
		void themeKey;
		requestAnimationFrame(applyStyles);
	});

	onMount(() => {
		let cancelled = false;
		(async () => {
			try {
				// Untyped vendor module; the parts Ribbon uses are typed in ./foliate.d.ts.
				await import('../../../../../vendor/foliate-js/view.js');
				if (cancelled) return;
				view = document.createElement('foliate-view') as FoliateView;
				view.style.display = 'block';
				view.style.height = '100%';
				hostEl!.appendChild(view);

				view.addEventListener('load', ((e: CustomEvent<{ doc: Document }>) => {
					const doc = e.detail.doc;
					doc.addEventListener('keydown', (ev: KeyboardEvent) => onKey?.(ev));
					doc.addEventListener('click', (ev: MouseEvent) => {
						if ((ev.target as Element | null)?.closest('a')) return;
						const frame = doc.defaultView?.frameElement?.getBoundingClientRect();
						const x = (frame?.left ?? 0) + ev.clientX;
						const w = window.innerWidth;
						onTap?.(x < w / 3 ? 'left' : x > (2 * w) / 3 ? 'right' : 'middle');
					});
				}) as EventListener);

				view.addEventListener('relocate', ((e: CustomEvent<FoliateLocation>) => {
					const loc = e.detail;
					const ordinal = loc.tocItem ? flatToc.findIndex((i) => i.href === loc.tocItem!.href) : -1;
					if (ordinal >= 0) {
						// Only the next chapter, not a jump: skipping ahead isn't finishing.
						if (lastOrdinal >= 0 && ordinal === lastOrdinal + 1) finished(lastOrdinal);
						lastOrdinal = ordinal;
					}
					onRelocate?.(loc);
				}) as EventListener);

				await view.open(src);
				flatToc = flatten(view.book.toc ?? []);
				applyStyles();
				if (startCfi) await view.init({ lastLocation: startCfi });
				else if (startFraction) await view.goToFraction(startFraction);
				else await view.init({ showTextStart: true });
				onReady?.({
					toc: view.book.toc ?? [],
					goTo: (href) => view!.goTo(href),
					goToFraction: (f) => view!.goToFraction(f)
				});
			} catch (err) {
				onError?.(err instanceof Error ? err.message : 'The book could not be opened.');
			}
		})();
		return () => {
			cancelled = true;
			view?.close();
			view?.remove();
		};
	});

	/** The contents entry you're in, counted through the flattened contents (the recap cut-off). */
	export function currentOrdinal(): number | undefined {
		return lastOrdinal >= 0 ? lastOrdinal : undefined;
	}
	export function next() {
		return view?.goRight();
	}
	export function prev() {
		return view?.goLeft();
	}
</script>

<div class="reader-host" bind:this={hostEl}></div>

<style>
	.reader-host {
		position: absolute;
		inset: 0;
	}
</style>
