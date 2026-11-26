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
	import { SYNCS_PLACES } from '#lib/library/index.ts';
	import { adoptedPlace, chooseOpen, fileShaOf, startAt } from '#lib/reader/places.ts';
	import { queueSend } from '#lib/reader/outbox.ts';
	import { sendSummary } from '#lib/reader/summaries.ts';
	import { RECAPS_ENABLED } from '#lib/ai/features.ts';
	import StorySoFar from '#lib/components/StorySoFar.svelte';
	import { recapWithBackfill, type RecapView } from '#lib/ai/recap.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const book = $derived(data.book?.book);
	const positions = $derived(splitPositions(data.book?.positions ?? []));
	const fileSha = $derived(fileShaOf(data.fileUrl));

	// Where to open (spec 004 FR-009): here, at a more recent place from another device (adopt),
	// or here with that place offered. Worked out once per book, from the places at open.
	const opening = $derived.by(() => {
		if (!book) return null;
		const saved = loadPlace(book.id);
		const here = positions.here;
		const mine = saved ?? (here ? { readAt: here.readAt, syncedAt: here.readAt } : null);
		const choice = chooseOpen(mine, data.book?.positions ?? []);
		if (choice.kind === 'adopt') {
			// Keeps the other device's readAt, so adopting is never a move of its own.
			savePlace(book.id, adoptedPlace(choice.from, fileSha));
			return { choice, start: startAt(choice.from, fileSha) };
		}
		const start = saved?.cfi
			? { cfi: saved.cfi }
			: saved
				? { href: saved.href || undefined, fraction: saved.percent / 100 }
				: here
					? startAt(here, fileSha)
					: {};
		return { choice, start };
	});
	/** The first location reported after opening is where it opened, not a move. */
	let opened = false;

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
			? { device: deviceName(positions.other), percent: positions.other.percent }
			: undefined
	);
	// Offered: a more recent place when both devices moved (FR-009), or, as in spec 002, a
	// place further on.
	const offered = $derived(
		opening?.choice.kind === 'offer'
			? opening.choice.from
			: positions.other && positions.other.percent > percent
				? positions.other
				: undefined
	);
	const chapterLabel = $derived(
		loc?.tocItem ? placeLabel(api?.toc ?? [], loc.tocItem) : (positions.here?.chapterLabel ?? '')
	);
	const showNotice = $derived(!!offered && !noticeDismissed);

	// Offline and not downloaded: a calm message instead of an error (spec 004 FR-005).
	let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine);
	$effect(() => {
		const update = () => (online = navigator.onLine);
		addEventListener('online', update);
		addEventListener('offline', update);
		return () => {
			removeEventListener('online', update);
			removeEventListener('offline', update);
		};
	});
	const offlineAway = $derived(!data.downloaded && !online);

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
		if (!book) return;
		const now = new Date().toISOString();
		const percent = Math.round(l.fraction * 1000) / 10;
		const before = loadPlace(book.id);
		// Opening a book reports where it opened; that isn't a move (FR-009). An adopted place
		// from another file gets this file's exact place, keeping its time.
		const first = !opened;
		opened = true;
		if (before?.cfi === l.cfi) return;
		if (first && before) {
			savePlace(book.id, { ...before, cfi: l.cfi, ...(fileSha ? { fileSha256: fileSha } : {}) });
			return;
		}
		const further = !before || percent >= before.furthestPercent;
		savePlace(book.id, {
			cfi: l.cfi,
			fraction: l.fraction,
			chapterLabel: l.tocItem?.label ?? '',
			savedAt: now,
			href: l.tocItem?.href ?? '',
			percent,
			furthestPercent: further ? percent : before.furthestPercent,
			furthestHref: further ? (l.tocItem?.href ?? '') : before.furthestHref,
			...(fileSha ? { fileSha256: fileSha } : {}),
			readAt: now,
			syncedAt: before?.syncedAt ?? null
		});
		if (SYNCS_PLACES) queueSend();
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

	/** Go to the offered place: exact on the same file, else its chapter, else its percentage. */
	async function goToOther() {
		if (!offered) return;
		const to = startAt(offered, fileSha);
		try {
			await api?.goTo((to.cfi ?? to.href)!);
		} catch {
			await api?.goToFraction(offered.percent / 100);
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
			{#if showNotice && offered}
				<KoboNotice
					device={deviceName(offered)}
					chapter={offered.chapterLabel}
					percent={offered.percent}
					further={offered.percent > percent}
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
		{#if offlineAway}
			<!-- Spec 004 FR-005, approved mock offline-states.html section 3. -->
			<div class="away" role="status">
				<h1>{book.title} isn’t on this device</h1>
				<p>
					You’re offline, so it can’t open now. It will open next time you’re connected, or download
					it then to read it anywhere.
				</p>
				<a class="go" href={resolve('/library')}>Back to the library</a>
			</div>
		{:else if !data.fileUrl || error}
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
				startCfi={opening?.start.cfi}
				startHref={opening?.start.href}
				startFraction={opening?.start.fraction}
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
	.away {
		max-width: 28rem;
		margin: 6rem auto 0;
		padding: 2.5rem 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		text-align: center;
		border: 1px solid var(--r-border);
		border-radius: var(--r-radius-md);
	}
	.away h1 {
		font-family: var(--r-font-reading);
		font-size: 1.375rem;
		line-height: 1.25;
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
	}
	.away p {
		color: var(--r-text-muted);
	}
	.away .go {
		display: inline-flex;
		align-items: center;
		min-height: var(--r-target);
		padding: 0.65rem 1.4rem;
		border-radius: var(--r-radius-pill);
		background: var(--r-action);
		color: var(--r-on-accent);
		font-weight: var(--r-weight-strong);
		text-decoration: none;
	}
	.away .go:hover {
		background: var(--r-accent);
	}
	.page {
		position: fixed;
		inset: 3.75rem 0 4.25rem;
	}
</style>
