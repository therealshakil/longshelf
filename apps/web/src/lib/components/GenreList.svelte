<!--
	Genres as a three-column list: name, count, and how many are still AI suggestions
	("All suggested" or "12 in Calibre · 29 suggested").
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ShelfSummary } from '@longshelf/shared/library';

	let { genres }: { genres: ShelfSummary[] } = $props();

	const note = (g: ShelfSummary) => {
		const s = g.suggested ?? 0;
		if (s === 0) return 'In Calibre';
		if (s >= g.count) return 'All suggested';
		return `${g.count - s} in Calibre · ${s} suggested`;
	};
</script>

<ul class="genres">
	{#each genres as g (g.id)}
		<li>
			<a href={resolve('/library/shelf/[kind]/[id]', { kind: 'genre', id: g.id })}>
				<b>{g.name}</b>
				<span class="n">{g.count} {g.count === 1 ? 'book' : 'books'}</span>
				<span class="st">{note(g)}</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.genres {
		columns: 3 16rem;
		column-gap: 2.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		break-inside: avoid;
		border-bottom: 1px solid var(--r-border);
	}
	a {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.1rem 1rem;
		padding: 0.75rem 0;
		text-decoration: none;
	}
	b {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-lg);
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
	}
	a:hover b {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	.n {
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
	}
	.st {
		grid-column: 1 / -1;
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
	}
</style>
