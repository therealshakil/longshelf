<!--
	Library (spec 002 US3, FR-003): six tabs in a fixed order. Matches design-mocks/library.html.
	Notes about where data comes from sit quietly at the bottom of their tab.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { bookSortKey } from '@longshelf/shared/library';
	import LibraryTabs, { TABS, type TabId } from '#lib/components/LibraryTabs.svelte';
	import BookGrid from '#lib/components/BookGrid.svelte';
	import AuthorList from '#lib/components/AuthorList.svelte';
	import CollectionStack from '#lib/components/CollectionStack.svelte';
	import GenreList from '#lib/components/GenreList.svelte';
	import PeriodicalRow from '#lib/components/PeriodicalRow.svelte';
	import LetterRail from '#lib/components/LetterRail.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import { headingLetter } from '#lib/library/letter-rail.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const tab = $derived.by((): TabId => {
		const t = page.url.searchParams.get('tab');
		return TABS.some((x) => x.id === t) ? (t as TabId) : 'recent';
	});

	function select(id: TabId) {
		const qs = id === 'recent' ? '' : `?tab=${id}`;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved path plus a query
		goto(`${resolve('/library')}${qs}`, { replace: true, reset: false });
	}

	const byLetter = $derived(
		Object.entries(
			data.all.reduce<Record<string, typeof data.all>>((acc, b) => {
				const l = headingLetter(bookSortKey(b));
				(acc[l] ??= []).push(b);
				return acc;
			}, {})
		)
	);
	const present = $derived(new Set(byLetter.map(([l]) => l)));
</script>

<svelte:head>
	<title>Library · Longshelf</title>
</svelte:head>

<main class="lib">
	<div class="head">
		<h1>Library</h1>
		<span class="text-sm text-text-muted">{data.total} books</span>
	</div>

	<LibraryTabs current={tab} onSelect={select}>
		{#snippet panel(id)}
			{#if id === 'recent'}
				{#if data.recent.thisWeek.length}
					<h2 class="group-h">This week</h2>
					<BookGrid books={data.recent.thisWeek} statuses={data.statuses} />
				{/if}
				{#if data.recent.earlier.length}
					<h2 class="group-h">Earlier</h2>
					<BookGrid books={data.recent.earlier} statuses={data.statuses} />
				{/if}
			{:else if id === 'authors'}
				<AuthorList authors={data.authors} />
			{:else if id === 'genres'}
				{#if data.genres.length}
					<GenreList genres={data.genres} />
				{:else}
					<EmptyState
						title={data.ai
							? 'No genres yet. They appear here once Longshelf has suggested some.'
							: 'No genres yet. Suggested genres appear here once AI features are switched on.'}
					/>
				{/if}
				<p class="note">
					Genres are suggested by AI and stay in Longshelf until you promote them to Calibre.
				</p>
			{:else if id === 'collections'}
				<ul class="colls">
					{#each data.collections as shelf (shelf.id)}
						<li><CollectionStack {shelf} /></li>
					{/each}
					<li class="none">
						<b>No collection</b>
						<span class="text-sm text-text-muted">{data.noCollection} books</span>
					</li>
				</ul>
				<p class="note">From Calibre’s Collection column. Longshelf never changes them.</p>
			{:else if id === 'news'}
				{#each data.periodicals as p (p.publication)}
					<section class="pub" aria-labelledby="pub-{p.issues[0]?.id}">
						<header class="pub-h">
							<h2 id="pub-{p.issues[0]?.id}">{p.publication}</h2>
							<span class="text-sm text-text-muted"
								>{p.frequency[0].toUpperCase() + p.frequency.slice(1)} · {p.issues.length} issues downloaded</span
							>
						</header>
						<PeriodicalRow issues={p.issues} label="{p.publication} issues" />
					</section>
				{/each}
				<p class="note">
					Fetched by Calibre’s news downloads. Older issues are removed when Calibre removes them.
				</p>
			{:else if id === 'all'}
				<p class="mb-4 text-sm text-text-muted">Sorted by title, ignoring “The”, “A” and “An”.</p>
				{#each byLetter as [letter, books] (letter)}
					<h2 class="letter" id="title-{letter}">{letter}</h2>
					<BookGrid {books} statuses={data.statuses} />
				{/each}
				<LetterRail {present} idPrefix="title-" />
			{/if}
		{/snippet}
	</LibraryTabs>
</main>

<style>
	.lib {
		padding: 1rem 0 4rem;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 1rem;
	}
	h1 {
		font-size: var(--r-text-page);
		line-height: 1.1;
		font-weight: var(--r-weight-title);
	}
	.group-h {
		font-size: var(--r-text-xl);
		font-weight: var(--r-weight-title);
		margin: 1.25rem 0 0.9rem;
		padding-bottom: 0.25rem;
		border-bottom: 1px solid var(--r-border);
	}
	.letter {
		font-size: var(--r-text-2xl);
		font-weight: 500;
		margin: 1.25rem 0 0.9rem;
		padding-bottom: 0.25rem;
		border-bottom: 1px solid var(--r-border);
		scroll-margin-top: 1rem;
	}
	.colls {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 2rem 1.75rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.colls li {
		max-inline-size: none;
	}
	.none {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		border-top: 1px solid var(--r-border);
		padding-top: 0.8rem;
	}
	.none b {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-lg);
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
	}
	.pub {
		padding: 1.25rem 0;
		border-bottom: 1px solid var(--r-border);
	}
	.pub-h {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 1rem;
		margin-bottom: 0.9rem;
	}
	.pub-h h2 {
		font-size: var(--r-text-xl);
		font-weight: var(--r-weight-title);
	}
	.note {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--r-border);
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
	}
</style>
