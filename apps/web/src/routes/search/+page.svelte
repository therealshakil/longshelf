<!-- Plain library search (DR-0008). Matches the owner's edited draft of the search design. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import SearchResults from '#lib/components/SearchResults.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const count = $derived.by(() => {
		const books = `${data.total} ${data.total === 1 ? 'book' : 'books'}`;
		return data.total > data.items.length ? `First ${data.items.length} of ${books}` : books;
	});
</script>

<svelte:head>
	<title>{data.q ? `Results for “${data.q}”` : 'Search'} · Longshelf</title>
</svelte:head>

<main class="page">
	<div class="head">
		<h1>{data.q ? `Results for “${data.q}”` : 'Search your library'}</h1>
		{#if data.q}<span class="count">{count}</span>{/if}
	</div>

	{#if data.items.length}
		<SearchResults items={data.items} />
	{:else}
		<div class="empty">
			{#if data.q}<p class="lead">No books in your library match this.</p>{/if}
			<p>Try a title, an author or a tag.</p>
			<a href={resolve('/library')}
				>Browse the library <ArrowRight class="size-4" aria-hidden="true" /></a
			>
		</div>
	{/if}
</main>

<style>
	.page {
		max-width: 55rem;
		padding: 1.25rem 0 3.5rem;
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.25rem 1.5rem;
		padding-bottom: 0.875rem;
		border-bottom: 1px solid var(--r-border);
	}
	h1 {
		font-size: clamp(1.75rem, 3vw, 2.25rem);
		font-weight: var(--r-weight-title);
		line-height: 1.15;
		overflow-wrap: anywhere;
	}
	.count {
		font-size: var(--r-text-sm);
		color: var(--r-text-muted);
		font-variant-numeric: tabular-nums;
	}
	.empty {
		max-width: 35rem;
		padding-top: 1.5rem;
	}
	.lead {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-lg);
		line-height: 1.4;
		color: var(--r-ink);
		margin-bottom: 0.375rem;
	}
	.empty a {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 2.75rem;
		margin-top: 0.625rem;
		font-weight: var(--r-weight-strong);
		text-decoration: none;
	}
	.empty a:hover {
		text-decoration: underline;
	}
</style>
