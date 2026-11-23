<!--
	Home (spec 002 US1, FR-002): the current book, the books you're also reading, then
	suggestions (US5), a way into the library, and the latest news and magazines.
	Matches design-mocks/index.html.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import CurrentBook from '#lib/components/CurrentBook.svelte';
	import LedgerRow from '#lib/components/LedgerRow.svelte';
	import PeriodicalRow from '#lib/components/PeriodicalRow.svelte';
	import { RECAPS_ENABLED } from '#lib/ai/features.ts';
	import ReadNextShelf from '#lib/components/ReadNextShelf.svelte';
	import StorySoFar from '#lib/components/StorySoFar.svelte';
	import type { BookWithPositions } from '@ribbon/shared/library';
	import { recapWithBackfill, type RecapView } from '#lib/ai/recap.ts';
	import { library } from '#lib/library/index.ts';
	import { daysAway, splitPositions } from '#lib/library/format.ts';
	import { flattenToc, openBook, placeOrdinal } from '#lib/reader/chapters.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Story so far (US4): opened from the "Away N days" pill on a ledger row.
	let recapOpen = $state(false);
	let recap = $state<RecapView>({ state: 'loading' });
	let recapFor = $state<BookWithPositions | null>(null);
	const recapPlace = $derived.by(() => {
		const here = recapFor ? splitPositions(recapFor.positions).here : undefined;
		return {
			label: here?.chapterLabel ?? '',
			percent: here?.percent ?? 0,
			readAt: here?.readAt,
			href: here?.href ?? ''
		};
	});

	/** The book's chapters and the owner's place in them, if its file is available. */
	async function openForRecap(bookId: string) {
		try {
			const url = await library.bookFileUrl(bookId);
			if (!url) return {};
			const book = await openBook(url);
			const chapters = flattenToc(book.toc ?? []);
			const ordinal = placeOrdinal(chapters, recapPlace, (h) => book.resolveHref?.(h)?.index);
			return { opened: { book, chapters }, ordinal };
		} catch {
			return {}; // no file to read: the recap uses the summaries Ribbon already has
		}
	}

	let recapRun: AbortController | null = null;
	const openRecap = (bookId: string) => runRecap(bookId, false);
	async function runRecap(bookId: string, all: boolean) {
		recapFor = data.also.find((b) => b.book.id === bookId) ?? null;
		if (!recapFor) return;
		recapRun?.abort();
		const run = (recapRun = new AbortController());
		recap = { state: 'loading' };
		recapOpen = true;
		const { opened, ordinal } = await openForRecap(bookId);
		const out = await recapWithBackfill(bookId, { ...recapPlace, ordinal }, opened, {
			signal: run.signal,
			all,
			onProgress: (done, total) => {
				if (!run.signal.aborted) recap = { state: 'loading', progress: { done, total } };
			}
		});
		if (out && !run.signal.aborted) recap = out;
	}
	// Closing the sheet stops any summarising, so nothing is spent unseen.
	$effect(() => {
		if (!recapOpen) recapRun?.abort();
	});
</script>

<svelte:head>
	<title>Longshelf</title>
</svelte:head>

<main>
	<h1 class="sr-only">Home</h1>

	{#if data.current}
		<section class="now" aria-labelledby="now-h">
			<h2 id="now-h" class="sr-only">Now reading</h2>
			<CurrentBook item={data.current} />
			{#if data.also.length}
				<div>
					<h3 class="also-h">Also reading</h3>
					<ol class="ledger">
						{#each data.also as item (item.book.id)}
							<LedgerRow {item} onStorySoFar={RECAPS_ENABLED && data.ai ? openRecap : undefined} />
						{/each}
					</ol>
				</div>
			{/if}
		</section>
	{/if}

	<ReadNextShelf title="Read next" items={data.readNext} url="/api/ai/read-next" />

	<a class="more" href={resolve('/library')}
		>Browse the library <ArrowRight class="size-4" aria-hidden="true" /></a
	>

	{#if data.periodicals.length}
		<section class="latest" aria-labelledby="latest-h">
			<h2 id="latest-h" class="section-h">Latest news &amp; magazines</h2>
			<PeriodicalRow issues={data.periodicals} label="Latest issues" />
		</section>
	{/if}
</main>

{#if recapFor}
	<StorySoFar
		bind:open={recapOpen}
		title={recapFor.book.title}
		author={recapFor.book.authors[0]?.name}
		place={recapPlace}
		awayDays={recapPlace.readAt ? daysAway(recapPlace.readAt, new Date()) : undefined}
		{recap}
		continueHref={resolve('/read/[id]', { id: recapFor.book.id })}
		onIncludeEarlier={() => recapFor && runRecap(recapFor.book.id, true)}
	/>
{/if}

<style>
	.now {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 2.5rem;
		padding: 1.75rem 0 2.5rem;
		border-bottom: 1px solid var(--r-border);
	}
	.also-h {
		font-family: var(--r-font-ui);
		font-size: var(--r-text-sm);
		font-weight: var(--r-weight-strong);
		color: var(--r-text);
		margin-bottom: 1rem;
	}
	.ledger {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.more {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 2rem;
		font-weight: var(--r-weight-strong);
		text-decoration: none;
	}
	.more:hover {
		text-decoration: underline;
	}
	.latest {
		padding: 2.25rem 0 3.5rem;
		min-width: 0;
	}
	.section-h {
		font-size: var(--r-text-xl);
		font-weight: var(--r-weight-title);
		margin-bottom: 1rem;
	}
</style>
