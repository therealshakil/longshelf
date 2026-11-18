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
		onChapterLeft,
		onTap,
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
		/** A chapter was left going forward: the owner finished it (US4 summaries). */
		onChapterLeft?: (chapter: { href: string; label: string }) => void;
		onTap?: (zone: 'left' | 'middle' | 'right') => void;
		onError?: (message: string) => void;
	} = $props();

	let hostEl = $state<HTMLDivElement>();
	let view: FoliateView | null = null;
	let lastChapter: { href: string; label: string } | null = null;
	let lastFraction = 0;

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
					const chapter = loc.tocItem ? { href: loc.tocItem.href, label: loc.tocItem.label } : null;
					if (
						lastChapter &&
						chapter &&
						chapter.href !== lastChapter.href &&
						loc.fraction > lastFraction
					)
						onChapterLeft?.(lastChapter);
					lastChapter = chapter ?? lastChapter;
					lastFraction = loc.fraction;
					onRelocate?.(loc);
				}) as EventListener);

				await view.open(src);
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
