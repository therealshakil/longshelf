<!-- A collection or genre as three fanned covers, its name and how many books it holds. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ShelfSummary } from '@longshelf/shared/library';

	let { shelf }: { shelf: ShelfSummary } = $props();
</script>

<a class="stack" href={resolve('/library/shelf/[kind]/[id]', { kind: shelf.kind, id: shelf.id })}>
	<span class="spread" aria-hidden="true">
		{#each shelf.sample as b (b.id)}
			{#if b.cover}<img src={b.cover.url} alt="" loading="lazy" />{/if}
		{/each}
	</span>
	<b>{shelf.name}</b>
	<span class="n">{shelf.count} {shelf.count === 1 ? 'book' : 'books'}</span>
</a>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		text-decoration: none;
	}
	.spread {
		display: flex;
		align-items: flex-end;
		height: 10.5rem;
		margin-bottom: 0.7rem;
	}
	img {
		width: 7rem;
		aspect-ratio: 2 / 3;
		object-fit: cover;
		border-radius: var(--r-radius-cover);
		box-shadow: var(--r-shadow-tile);
		background: var(--r-surface);
	}
	img + img {
		margin-left: -3.5rem;
	}
	b {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-lg);
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
	}
	.stack:hover b {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}
	.n {
		font-size: var(--r-text-sm);
		color: var(--r-text-muted);
	}
</style>
