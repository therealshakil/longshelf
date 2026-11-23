<!--
	One collection or genre (spec 002 US3): name, count, sort, and its books. Matches
	design-mocks/shelf.html. Collections come from Calibre and are never changed by Ribbon.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import BookGrid from '#lib/components/BookGrid.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const s = $derived(data.shelf);
	const finished = $derived(
		Object.values(data.statuses).filter((x) => x.kind === 'finished').length
	);
	const SORTS = [
		{ id: 'title', label: 'Title' },
		{ id: 'author', label: 'Author' },
		{ id: 'added', label: 'Recently added' }
	] as const;
	const tabFor = $derived(s.kind === 'genre' ? 'genres' : 'collections');
</script>

<svelte:head>
	<title>{s.name} · Longshelf</title>
</svelte:head>

<main class="page">
	<nav class="crumbs" aria-label="Breadcrumb">
		<a href={resolve('/library')}>Library</a><span aria-hidden="true">/</span><a
			href="{resolve('/library')}?tab={tabFor}">{s.kind === 'genre' ? 'Genres' : 'Collections'}</a
		>
	</nav>
	<div class="head">
		<div>
			<h1>{s.name}</h1>
			<p class="meta">
				{s.count}
				{s.count === 1 ? 'book' : 'books'}{#if finished}
					· {finished} finished{/if}
			</p>
		</div>
		<nav class="sort" aria-label="Sort">
			{#each SORTS as o (o.id)}
				<a
					href="{resolve('/library/shelf/[kind]/[id]', { kind: s.kind, id: s.id })}?sort={o.id}"
					aria-current={data.sort === o.id ? 'true' : undefined}
					data-sveltekit-replacestate
					data-sveltekit-noscroll>{o.label}</a
				>
			{/each}
		</nav>
	</div>
	<BookGrid books={s.books} statuses={data.statuses} />
	<p class="note">
		{s.kind === 'genre'
			? 'Genres are suggested by AI and stay in Longshelf until you promote them to Calibre.'
			: 'A collection from Calibre’s Collection column. Longshelf never changes it.'}
	</p>
</main>

<style>
	.page {
		padding: 1rem 0 4rem;
	}
	.crumbs {
		display: flex;
		gap: 0.5rem;
		font-size: var(--r-text-sm);
		margin-bottom: 0.75rem;
		color: var(--r-text-muted);
	}
	.crumbs a {
		color: var(--r-text-muted);
		text-decoration: none;
	}
	.crumbs a:hover {
		color: var(--r-ink);
		text-decoration: underline;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	h1 {
		font-size: var(--r-text-display);
		line-height: var(--r-leading-display);
		font-weight: var(--r-weight-title);
	}
	.meta {
		color: var(--r-text-muted);
		margin-top: 0.4rem;
	}
	.sort {
		display: inline-flex;
		padding: 0.2rem;
		border: 1px solid var(--r-control);
		border-radius: var(--r-radius-pill);
	}
	.sort a {
		display: inline-flex;
		align-items: center;
		min-height: 2.25rem;
		padding: 0.35rem 0.9rem;
		border-radius: var(--r-radius-pill);
		font-size: var(--r-text-sm);
		color: var(--r-text-muted);
		text-decoration: none;
	}
	.sort a[aria-current] {
		background: var(--r-action);
		color: var(--r-on-accent);
		font-weight: var(--r-weight-strong);
	}
	.note {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--r-border);
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
	}
</style>
