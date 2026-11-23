<!--
	The reader (spec 002 US2). Matches design-mocks/reader.html: a typeset page first, controls
	second. A tap in the middle of the page hides or shows the bars; in page mode the edges turn
	pages. Text settings apply to every book on this device.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { resolve } from '$app/paths';
	import Reader from '#lib/reader/Reader.svelte';
	import type { FoliateLocation, ReaderApi } from '#lib/reader/foliate.d.ts';
	import { placeLabel } from '#lib/reader/chapters.ts';
	import { loadPlace, loadSettings, savePlace, saveSettings } from '#lib/reader/settings.ts';
	import ReaderChrome from '#lib/components/ReaderChrome.svelte';
	import KoboNotice from '#lib/components/KoboNotice.svelte';
	import TextPanel from '#lib/components/TextPanel.svelte';
	import ContentsPanel from '#lib/components/ContentsPanel.svelte';
	import ErrorState from '#lib/components/ErrorState.svelte';
	import { deviceName, splitPositions } from '#lib/library/format.ts';
	import { sendSummary } from '#lib/reader/summaries.ts';
	import { RECAPS_ENABLED } from '#lib/ai/features.ts';
	import StorySoFar from '#lib/components/StorySoFar.svelte';
	import { recapWithBackfill, type RecapView } from '#lib/ai/recap.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const book = $derived(data.book?.book);
	const positions = $derived(splitPositions(data.book?.positions ?? []));
	const saved = $derived(book ? loadPlace(book.id) : null);

	let settings = $state(loadSettings());
	let hidden = $state(false);
	let textOpen = $state(false);
	let contentsOpen = $state(false);
	let bookmarked = $state(false);
	let noticeDismissed = $state(false);
	let error = $state<string | null>(null);
	let api = $state<ReaderApi | null>(null);
	let loc = $state<FoliateLocation | null>(null);
	let reader = $state<ReturnType<typeof Reader> | null>(null);
	let topHeight = $state(60);
	let recapOpen = $state(false);
	let recap = $state<RecapView>({ state: 'loading' });

	// Story so far (US4), up to where you are now.
	let recapRun: AbortController | null = null;
	const openRecap = () => runRecap(false);
	async function runRecap(all: boolean) {
		if (!book) return;
		recapRun?.abort();
		const run = (recapRun = new AbortController());
		recap = { state: 'loading' };
		recapOpen = true;
		const out = await recapWithBackfill(
			book.id,
			{ percent, label: chapterLabel, ordinal: reader?.currentOrdinal() },
			reader?.openedBook(),
			{
				signal: run.signal,
				all,
				onProgress: (done, total) => {
					if (!run.signal.aborted) recap = { state: 'loading', progress: { done, total } };
				}
			}
		);
		if (out && !run.signal.aborted) recap = out;
	}
	// Closing the sheet stops any summarising, so nothing is spent unseen.
	$effect(() => {
		if (!recapOpen) recapRun?.abort();
	});

	const percent = $derived(loc ? Math.round(loc.fraction * 100) : (positions.here?.percent ?? 0));
	const other = $derived(
		positions.other
			? { device: deviceName(positions.other.source), percent: positions.other.percent }
			: undefined
	);
	const chapterLabel = $derived(
		loc?.tocItem ? placeLabel(api?.toc ?? [], loc.tocItem) : (positions.here?.chapterLabel ?? '')
	);
	const showNotice = $derived(!!other && !noticeDismissed && other.percent > percent);

	$effect(() => saveSettings($state.snapshot(settings)));

	// Theme: Paper and Night override the system; Match system leaves it alone.
	const themeKey = $derived(settings.theme);
	$effect(() => {
		const root = document.documentElement;
		if (settings.theme === 'night') root.dataset.theme = 'night';
		else if (settings.theme === 'paper') root.dataset.theme = 'light';
		else delete root.dataset.theme;
	});
	// Anything queued while offline goes now (US4).
	$effect(() => {
		if (RECAPS_ENABLED) void sendSummary(null);
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') delete document.documentElement.dataset.theme;
	});

	function onRelocate(l: FoliateLocation) {
		loc = l;
		if (book)
			savePlace(book.id, {
				cfi: l.cfi,
				fraction: l.fraction,
				chapterLabel: l.tocItem?.label ?? '',
				savedAt: new Date().toISOString()
			});
	}

	// Keyboard page turning: arrows and Page Up/Down, unless a panel is open or a field has focus.
	function onKey(e: KeyboardEvent) {
		if (textOpen || contentsOpen || e.altKey || e.ctrlKey || e.metaKey) return;
		const t = e.target as HTMLElement | null;
		if (t?.closest('input, textarea, select, [contenteditable]')) return;
		if (e.key === 'ArrowRight' || e.key === 'PageDown') {
			e.preventDefault();
			reader?.next();
		} else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
			e.preventDefault();
			reader?.prev();
		}
	}

	/** Go to the other device's chapter, or its percentage if that link isn't in this book. */
	async function goToOther() {
		if (!positions.other) return;
		try {
			await api?.goTo(positions.other.href);
		} catch {
			await api?.goToFraction(positions.other.percent / 100);
		}
	}

	function onTap(zone: 'left' | 'middle' | 'right') {
		if (zone === 'middle' || settings.page === 'scroll') hidden = !hidden;
		else if (zone === 'left') reader?.prev();
		else reader?.next();
	}
</script>

<svelte:window onkeydown={onKey} />

<svelte:head>
	<title>{book?.title ?? 'Book'} · Reading · Longshelf</title>
</svelte:head>

{#if !book}
	<main class="mx-auto max-w-[36rem] px-4 py-16">
		<ErrorState
			what="This isn’t on this device yet."
			lost="Nothing is lost. It opens here once it has been downloaded from Calibre."
			next={{ label: 'Back to Home', href: resolve('/') }}
		/>
	</main>
{:else}
	<ReaderChrome
		title={book.title}
		chapter={chapterLabel}
		{percent}
		{other}
		minutesLeft={loc?.time ? Math.round(loc.time.section) : undefined}
		{hidden}
		{bookmarked}
		bind:topHeight
		backHref={resolve('/book/[id]', { id: book.id })}
		onContents={() => (contentsOpen = true)}
		onText={() => (textOpen = true)}
		onBookmark={() => (bookmarked = !bookmarked)}
		onStorySoFar={RECAPS_ENABLED && data.ai ? openRecap : undefined}
	>
		{#snippet notice()}
			{#if showNotice && other && positions.other}
				<KoboNotice
					device={other.device}
					chapter={positions.other.chapterLabel}
					percent={other.percent}
					onGo={() => {
						void goToOther();
						noticeDismissed = true;
					}}
					onStay={() => (noticeDismissed = true)}
				/>
			{/if}
		{/snippet}
	</ReaderChrome>

	<main class="page" style:top="{topHeight}px" aria-label="{book.title}, reading">
		{#if !data.fileUrl || error}
			<div class="mx-auto max-w-[36rem] px-4 pt-24">
				<ErrorState
					what={error ? 'This book couldn’t be opened.' : 'This book isn’t on this device yet.'}
					lost="Nothing is lost. Your place is saved."
					next={{ label: 'Back to the book', href: resolve('/book/[id]', { id: book.id }) }}
				/>
			</div>
		{:else}
			<Reader
				bind:this={reader}
				src={data.fileUrl}
				{settings}
				{themeKey}
				startCfi={saved?.cfi}
				startHref={saved ? undefined : positions.here?.href}
				startFraction={saved ? undefined : (positions.here?.percent ?? 0) / 100}
				onReady={(a) => (api = a)}
				{onRelocate}
				{onTap}
				{onKey}
				onChapterFinished={(c) =>
					RECAPS_ENABLED &&
					c.text.length >= 400 &&
					sendSummary({
						bookId: book.id,
						href: c.href,
						chapterLabel: c.label,
						ordinal: c.ordinal,
						text: c.text.slice(0, 200_000)
					})}
				onError={(m) => (error = m)}
			/>
		{/if}
	</main>

	<TextPanel bind:open={textOpen} bind:settings />
	<StorySoFar
		bind:open={recapOpen}
		title={book.title}
		author={book.authors[0]?.name}
		place={{ label: chapterLabel, percent }}
		{recap}
		onIncludeEarlier={() => runRecap(true)}
	/>
	<ContentsPanel
		bind:open={contentsOpen}
		title={book.title}
		toc={api?.toc ?? []}
		currentHref={loc?.tocItem?.href}
		onPick={(href) => api?.goTo(href)}
	/>
{/if}

<style>
	.page {
		position: fixed;
		inset: 3.75rem 0 4.25rem;
	}
</style>
