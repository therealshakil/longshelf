<!--
	Author page (spec 002 US3): portrait and short biography with their source (left out when
	unknown), your books by them, and their notable works marking which you own (DR-0005).
	Matches design-mocks/author.html.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { shortWorkList, statusLabel } from '@ribbon/shared/library';
	import BookTile from '#lib/components/BookTile.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const a = $derived(data.page.author);
	const owned = $derived(new Map(data.page.books.map((b) => [b.book.id, b])));
	// Stored by author so moving to another author's page starts collapsed.
	let expandedFor = $state<string | null>(null);
	const shortList = $derived(shortWorkList(a.bibliography));
	const canExpand = $derived(shortList.length < a.bibliography.length);
	const expanded = $derived(expandedFor === a.id);
	const works = $derived(expanded ? a.bibliography : shortList);
	// Name only the sources this author's page actually uses.
	const credits = $derived.by(() => {
		const fromWikipedia =
			a.bio && a.portrait ? 'Biography and photo' : a.bio ? 'Biography' : a.portrait ? 'Photo' : '';
		return [
			fromWikipedia && `${fromWikipedia} from Wikipedia.`,
			a.bibliography.length ? 'Notable works from Wikidata.' : ''
		]
			.filter(Boolean)
			.join(' ');
	});
</script>

<svelte:head>
	<title>{a.name} · Longshelf</title>
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
				<figcaption>
					{a.portrait.credit} ·
					{#if a.portrait.source}<a href={a.portrait.source} rel="external">{a.portrait.licence}</a
						>{:else}{a.portrait.licence}{/if}
				</figcaption>
			</figure>
		{/if}
		<div>
			<h1>{a.name}</h1>
			{#if a.lifeDates}<p class="life">{a.lifeDates}</p>{/if}
			{#if a.bio}
				<p class="bio">{a.bio.text}</p>
				<p class="src">
					Biography from Wikipedia, CC BY-SA 4.0 ·
					<a href={a.bio.source} rel="external">Read more</a>
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
		<h2 class="section-h">Notable works</h2>
		<ol class="bib">
			{#each works as w (w.title)}
				{@const mine = w.ownedBookId ? owned.get(w.ownedBookId) : undefined}
				<li class:missing={!mine}>
					<span class="y">{w.year ?? '—'}</span>
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
		{#if canExpand}
			<button
				type="button"
				class="more"
				class:open={expanded}
				aria-expanded={expanded}
				onclick={() => (expandedFor = expanded ? null : a.id)}
			>
				{expanded ? 'Show fewer' : 'Show all'}
				{#if !expanded}<span>{a.bibliography.length} works</span>{/if}
			</button>
		{/if}
	{/if}
	{#if credits}
		<p class="note">{credits} Your library comes from Calibre.</p>
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
	figcaption a {
		color: inherit;
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
	.more {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-height: 2.75rem;
		margin-top: 0.75rem;
		padding: 0;
		background: none;
		border: 0;
		cursor: pointer;
		font-family: var(--r-font-reading);
		font-size: var(--r-text-lg);
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
	}
	.more:hover {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	.more::before {
		content: '';
		width: 0.5rem;
		height: 0.5rem;
		margin: 0 0.25rem 0 0.1rem;
		border-right: 0.125rem solid var(--r-text-muted);
		border-bottom: 0.125rem solid var(--r-text-muted);
		transform: rotate(45deg);
	}
	.more.open::before {
		transform: rotate(-135deg);
	}
	.more span {
		font-family: var(--r-font-ui, inherit);
		font-size: var(--r-text-sm);
		font-weight: var(--r-weight-regular);
		color: var(--r-text-muted);
	}
	.note {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--r-border);
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
	}
	@media (max-width: 40rem) {
		.top,
		.top.no-portrait {
			grid-template-columns: minmax(0, 1fr);
			gap: 1.25rem;
		}
		figure {
			max-inline-size: 9rem;
		}
		h1 {
			font-size: var(--r-text-2xl);
		}
	}
</style>
