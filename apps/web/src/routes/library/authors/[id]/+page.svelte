<!--
	Author page (spec 002 US3): portrait and short biography with their source (left out when
	unknown), your books by them, and their bibliography marking which you own.
	Matches design-mocks/author.html.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { statusLabel } from '@ribbon/shared/library';
	import BookTile from '#lib/components/BookTile.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const a = $derived(data.page.author);
	const owned = $derived(new Map(data.page.books.map((b) => [b.book.id, b])));
</script>

<svelte:head>
	<title>{a.name} · Ribbon</title>
</svelte:head>

<main class="page">
	<nav class="crumbs" aria-label="Breadcrumb">
		<a href={resolve('/library')}>Library</a><span aria-hidden="true">/</span><a
			href="{resolve('/library')}?tab=authors">Authors</a
		>
	</nav>
	<div class="top" class:no-portrait={!a.portrait}>
		{#if a.portrait}
			<figure>
				<img src={a.portrait.url} alt={a.portrait.alt} />
				<figcaption>{a.portrait.credit}</figcaption>
			</figure>
		{/if}
		<div>
			<h1>{a.name}</h1>
			{#if a.lifeDates}<p class="life">{a.lifeDates}</p>{/if}
			{#if a.bio}
				<p class="bio">{a.bio.text}</p>
				<p class="src">
					Biography from Wikipedia · <a href={a.bio.source} rel="external">Read more</a>
				</p>
			{/if}
			<p class="meta">
				{data.page.books.length}
				{data.page.books.length === 1 ? 'book' : 'books'} in your library{#if data.page.finishedCount}{` · ${data.page.finishedCount} finished`}{/if}
			</p>
		</div>
	</div>

	<h2 class="section-h">In your library</h2>
	<ul class="grid">
		{#each data.page.books as b (b.book.id)}
			<li><BookTile book={b.book} status={b.status} /></li>
		{/each}
	</ul>

	{#if a.bibliography.length}
		<h2 class="section-h">Bibliography</h2>
		<ol class="bib">
			{#each a.bibliography as w (w.title)}
				{@const mine = w.ownedBookId ? owned.get(w.ownedBookId) : undefined}
				<li class:missing={!mine}>
					<span class="y">{w.year}</span>
					{#if mine}
						<a class="t" href={resolve('/book/[id]', { id: mine.book.id })}>{w.title}</a>
						<span class="s" class:active={mine.status.kind === 'in-progress'}
							>{statusLabel(mine.status) ?? 'In your library'}</span
						>
					{:else}
						<span class="t">{w.title}</span>
						<span class="s">Not in your library</span>
					{/if}
				</li>
			{/each}
		</ol>
		<p class="note">
			Novels and novellas, by first publication. Bibliography and biography come from public
			sources; your library comes from Calibre.
		</p>
	{/if}
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
	}
	.crumbs a {
		color: var(--r-text-muted);
		text-decoration: none;
	}
	.crumbs a:hover {
		color: var(--r-ink);
		text-decoration: underline;
	}
	.crumbs span {
		color: var(--r-text-muted);
	}
	.top {
		display: grid;
		grid-template-columns: minmax(0, 13rem) minmax(0, 40rem);
		gap: 2.5rem;
		align-items: start;
		margin-bottom: 2.5rem;
	}
	.top.no-portrait {
		grid-template-columns: minmax(0, 40rem);
	}
	figure {
		margin: 0;
	}
	figure img {
		width: 100%;
		aspect-ratio: 4 / 5;
		object-fit: cover;
		object-position: top;
		border-radius: var(--r-radius-cover);
		box-shadow: var(--r-shadow-tile);
	}
	figcaption {
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
		margin-top: 0.5rem;
	}
	h1 {
		font-size: var(--r-text-display);
		line-height: var(--r-leading-display);
		font-weight: var(--r-weight-title);
	}
	.life {
		color: var(--r-text-muted);
		margin: 0.35rem 0 1rem;
	}
	.bio {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-lg);
		line-height: 1.6;
		color: var(--r-text);
	}
	.src {
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
		margin-top: 0.6rem;
	}
	.meta {
		margin-top: 1.25rem;
		font-weight: var(--r-weight-strong);
	}
	.section-h {
		font-size: var(--r-text-xl);
		font-weight: var(--r-weight-title);
		margin: 2.5rem 0 1rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--r-border);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
		gap: 1.75rem 1.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.grid li,
	.bib li {
		max-inline-size: none;
	}
	.bib {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.bib li {
		display: grid;
		grid-template-columns: 4rem minmax(0, 1fr) auto;
		gap: 1rem;
		align-items: baseline;
		padding: 0.6rem 0;
		border-bottom: 1px solid var(--r-border);
	}
	.y {
		font-size: var(--r-text-sm);
		color: var(--r-text-muted);
		font-variant-numeric: tabular-nums;
	}
	.t {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-lg);
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
		text-decoration: none;
	}
	a.t:hover {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	.missing .t {
		color: var(--r-text-muted);
		font-weight: var(--r-weight-regular);
	}
	.s {
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
	}
	.s.active {
		color: var(--r-accent);
		font-weight: var(--r-weight-strong);
	}
	.note {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--r-border);
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
	}
	@media (max-width: 40rem) {
		.top {
			grid-template-columns: 7rem minmax(0, 1fr);
			gap: 1.25rem;
		}
		.bio,
		.src,
		.meta {
			grid-column: 1 / -1;
		}
		h1 {
			font-size: var(--r-text-2xl);
		}
	}
</style>
