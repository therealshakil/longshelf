<!--
	Book page (spec 002 US3): header with progress and actions, the description from Calibre, and
	genres (US6), details, then More like this (US5).
	Matches design-mocks/book.html.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import BookHeader from '#lib/components/BookHeader.svelte';
	import GenreChips from '#lib/components/GenreChips.svelte';
	import ReadNextShelf from '#lib/components/ReadNextShelf.svelte';
	import { fileSize } from '#lib/library/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const item = $derived(data.book);
	const author = $derived(item.book.authors[0]);
	let downloaded = $state(false);
	const paras = $derived((item.book.description ?? '').split(/\n\s*\n/).filter(Boolean));
</script>

<svelte:head>
	<title>{item.book.title} · Longshelf</title>
</svelte:head>

<main class="page">
	<nav class="crumbs" aria-label="Breadcrumb">
		<a href={resolve('/library')}>Library</a>
		{#if author}<span aria-hidden="true">/</span><a
				href={resolve('/library/authors/[id]', { id: author.id })}>{author.name}</a
			>{/if}
	</nav>

	<BookHeader {item} bind:downloaded />

	<div class="cols">
		<section aria-labelledby="about-h">
			<h2 id="about-h" class="section-h">About this book</h2>
			{#if paras.length}
				<div class="desc">
					{#each paras as p, i (i)}<p>{p}</p>{/each}
				</div>
				<p class="src">Description from Calibre</p>
			{:else}
				<p class="text-text-muted">There’s no description for this book in Calibre.</p>
			{/if}
		</section>
		<aside>
			{#if data.genres.length}
				<h2 class="section-h">Genres</h2>
				{#key item.book.id}
					<GenreChips bookId={item.book.id} genres={data.genres} />
				{/key}
			{/if}
			<h2 class="section-h">Details</h2>
			<dl class="details">
				{#if data.files.length}
					<!-- Spec 003 FR-012, owner-approved option B: save any stored format. -->
					<dt>Files</dt>
					<dd class="files">
						{#each data.files as f (f.format)}
							<span>
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- an API file download, not a page -->
								<a href={f.url} download>{f.format}</a>
								<span class="size">{fileSize(f.size)}</span>
							</span>
						{/each}
					</dd>
				{/if}
				{#each item.details as d (d.label)}
					<dt>{d.label}</dt>
					<dd>{d.value}</dd>
				{/each}
			</dl>
		</aside>
	</div>

	{#key item.book.id}
		<ReadNextShelf
			title="More like this in your library"
			items={data.moreLike}
			url={`/api/ai/more-like/${encodeURIComponent(item.book.id)}`}
			variant="book"
		/>
	{/key}
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
	.cols {
		display: grid;
		grid-template-columns: minmax(0, 40rem) minmax(0, 22rem);
		justify-content: space-between;
		gap: 4rem;
		margin-top: 1rem;
	}
	.section-h {
		font-size: var(--r-text-xl);
		font-weight: var(--r-weight-title);
		margin: 2.5rem 0 1rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--r-border);
	}
	.desc {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-lg);
		line-height: 1.65;
	}
	.desc p + p {
		margin-top: 0.9em;
	}
	.src {
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
		margin-top: 0.6rem;
	}
	.details {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.5rem 1.5rem;
		font-size: var(--r-text-sm);
		margin: 0;
	}
	.details dt {
		color: var(--r-text-muted);
		font-size: var(--r-text-xs);
	}
	.details dd {
		margin: 0;
	}
	.files {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.files a {
		text-underline-offset: 0.2em;
	}
	.files .size {
		color: var(--r-text-muted);
	}
	@media (max-width: 64rem) {
		.cols {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}
</style>
