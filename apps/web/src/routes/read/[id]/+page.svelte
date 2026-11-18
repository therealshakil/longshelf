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
	import { loadPlace, loadSettings, savePlace, saveSettings } from '#lib/reader/settings.ts';
	import ReaderChrome from '#lib/components/ReaderChrome.svelte';
	import KoboNotice from '#lib/components/KoboNotice.svelte';
	import TextPanel from '#lib/components/TextPanel.svelte';
	import ContentsPanel from '#lib/components/ContentsPanel.svelte';
	import ErrorState from '#lib/components/ErrorState.svelte';
	import { deviceName, splitPositions } from '#lib/library/format.ts';
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

	const percent = $derived(loc ? Math.round(loc.fraction * 100) : (positions.here?.percent ?? 0));
	const other = $derived(
		positions.other
			? { device: deviceName(positions.other.source), percent: positions.other.percent }
			: undefined
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

	function onTap(zone: 'left' | 'middle' | 'right') {
		if (zone === 'middle' || settings.page === 'scroll') hidden = !hidden;
		else if (zone === 'left') reader?.prev();
		else reader?.next();
	}
</script>

<svelte:head>
	<title>{book?.title ?? 'Book'} · Reading · Ribbon</title>
</svelte:head>

{#if !book}
	<main class="mx-auto max-w-[36rem] px-4 py-16">
		<ErrorState
			what="That book isn’t in your library."
			lost="Nothing is lost."
			next={{ label: 'Back to Home', href: resolve('/') }}
		/>
	</main>
{:else}
	<ReaderChrome
		title={book.title}
		chapter={loc?.tocItem?.label ?? positions.here?.chapterLabel}
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
	>
		{#snippet notice()}
			{#if showNotice && other && positions.other}
				<KoboNotice
					device={other.device}
					chapter={positions.other.chapterLabel}
					percent={other.percent}
					onGo={() => {
						api?.goToFraction(other.percent / 100);
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
				startFraction={saved ? undefined : (positions.here?.percent ?? 0) / 100}
				onReady={(a) => (api = a)}
				{onRelocate}
				{onTap}
				onError={(m) => (error = m)}
			/>
		{/if}
	</main>

	<TextPanel bind:open={textOpen} bind:settings />
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
