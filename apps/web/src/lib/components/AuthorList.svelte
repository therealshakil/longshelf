<!--
	Every author, grouped under letter headings, each with their book count and a link to their
	page. Three columns on wide screens, one on phones.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Author } from '@ribbon/shared/library';
	import { headingLetter } from '#lib/library/letter-rail.ts';

	let { authors }: { authors: { author: Author; bookCount: number }[] } = $props();

	const groups = $derived(
		Object.entries(
			authors.reduce<Record<string, typeof authors>>((acc, a) => {
				const l = headingLetter(a.author.sort);
				(acc[l] ??= []).push(a);
				return acc;
			}, {})
		)
	);
</script>

<p class="mb-5 text-sm text-text-muted">{authors.length} authors</p>
<div class="authors">
	{#each groups as [letter, list] (letter)}
		<section class="group" aria-labelledby="authors-{letter}">
			<h3 id="authors-{letter}" class="letter">{letter}</h3>
			<ul>
				{#each list as { author, bookCount } (author.id)}
					<li>
						<a href={resolve('/library/authors/[id]', { id: author.id })}>
							<span class="name">{author.name}</span>
							<span class="n">{bookCount} {bookCount === 1 ? 'book' : 'books'}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.authors {
		columns: 3 16rem;
		column-gap: 3rem;
	}
	.group {
		break-inside: avoid;
		margin-bottom: 1.25rem;
	}
	.letter {
		font-size: var(--r-text-xl);
		font-weight: 500;
		padding-bottom: 0.25rem;
		margin-bottom: 0.25rem;
		border-bottom: 1px solid var(--r-border);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	a {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		padding: 0.55rem 0;
		border-bottom: 1px solid var(--r-border);
		text-decoration: none;
	}
	.name {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-lg);
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
	}
	a:hover .name {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}
	.n {
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
</style>
