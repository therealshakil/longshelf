<!--
	One book in the "Also reading" ledger ("Compact band", approved 2026-11-18). The whole row is one
	link to the book (the title link is stretched over it, so there is one link per book, FR-008);
	the Story so far pill sits above it as its own link. A grey second bar shows the other device.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import type { BookWithPositions } from '@ribbon/shared/library';
	import { daysAway, deviceName, splitPositions } from '#lib/library/format.ts';

	let {
		item,
		now = new Date(),
		onStorySoFar
	}: { item: BookWithPositions; now?: Date; onStorySoFar?: (bookId: string) => void } = $props();

	const book = $derived(item.book);
	const pos = $derived(splitPositions(item.positions));
	const away = $derived(pos.here ? daysAway(pos.here.readAt, now) : 0);
	const readHref = $derived(resolve('/read/[id]', { id: book.id }));
</script>

<li class="row">
	<span class="cover" aria-hidden="true">
		{#if book.cover}<img src={book.cover.url} alt="" />{/if}
	</span>
	<div class="body">
		<a class="title" href={readHref}>{book.title}</a>
		{#if pos.here}
			<span class="num"><b>{pos.here.percent}%</b>{pos.here.chapterLabel}</span>
		{/if}
		<span class="author">{book.authors[0]?.name ?? 'Unknown author'}</span>
		{#if pos.here}
			<span class="trk" aria-hidden="true"><i style:width="{pos.here.percent}%"></i></span>
		{/if}
		{#if pos.other}
			<span class="other">
				<span class="trk trk-other" aria-hidden="true"
					><i style:width="{pos.other.percent}%"></i></span
				>
				<span>{deviceName(pos.other.source)} {pos.other.percent}%</span>
			</span>
		{/if}
		{#if away >= 7 && onStorySoFar}
			<button class="pill" type="button" onclick={() => onStorySoFar(book.id)}>
				Away {away} days · Story so far
			</button>
		{/if}
	</div>
	<span class="cue" aria-hidden="true"><ArrowRight class="size-4" /></span>
</li>

<style>
	.row {
		max-inline-size: none;
		position: relative;
		display: grid;
		grid-template-columns: 5.5rem minmax(0, 1fr) 2.75rem;
		gap: 1.5rem;
		align-items: center;
		padding: 1.25rem 0.75rem;
		margin: 0 -0.75rem;
		border-top: 1px solid var(--r-border);
		border-radius: var(--r-radius-sm);
	}
	.row:last-child {
		border-bottom: 1px solid var(--r-border);
	}
	.row:hover {
		background: color-mix(in oklab, var(--r-bg), var(--r-ink) 4%);
	}
	.row:has(.title:focus-visible) {
		outline: var(--r-focus-width) solid var(--r-focus);
		outline-offset: var(--r-focus-offset);
	}
	.cover img {
		width: 100%;
		aspect-ratio: 2 / 3;
		object-fit: cover;
		border-radius: var(--r-radius-cover);
		box-shadow: var(--r-shadow-tile);
		background: var(--r-surface);
	}
	.body {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.25rem 2rem;
		align-items: baseline;
	}
	.title {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-xl);
		font-weight: var(--r-weight-title);
		line-height: var(--r-leading-tight);
		color: var(--r-ink);
		text-decoration: none;
	}
	/* The title link covers the whole row: one target, one link per book. */
	.title::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: var(--r-radius-sm);
	}
	.title:focus-visible {
		outline: none;
	}
	.row:hover .title {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}
	.author {
		grid-column: 1;
		font-family: var(--r-font-reading);
		color: var(--r-text-muted);
	}
	.num {
		grid-column: 2;
		grid-row: 1;
		text-align: right;
		font-size: var(--r-text-sm);
		color: var(--r-text-muted);
		font-variant-numeric: tabular-nums;
	}
	.num b {
		color: var(--r-accent);
		font-size: var(--r-text-lg);
		margin-right: 0.35rem;
	}
	.trk {
		grid-column: 1 / -1;
		position: relative;
		height: 0.125rem;
		background: var(--r-border);
		margin-top: 0.75rem;
	}
	.trk i {
		position: absolute;
		inset: 0 auto 0 0;
		background: var(--r-accent);
	}
	.other {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 1rem;
		align-items: center;
		margin-top: 0.3rem;
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
		font-variant-numeric: tabular-nums;
	}
	.trk-other {
		grid-column: 1;
		margin: 0;
	}
	.trk-other i {
		background: var(--r-control);
	}
	.pill {
		position: relative;
		z-index: 1;
		grid-column: 1 / -1;
		justify-self: start;
		margin-top: 0.6rem;
		font: inherit;
		font-size: var(--r-text-xs);
		color: var(--r-accent);
		background: transparent;
		border: 1px solid currentColor;
		border-radius: var(--r-radius-pill);
		padding: 0.3rem 0.75rem;
		min-height: 1.5rem;
		cursor: pointer;
	}
	.cue {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--r-radius-pill);
		background: var(--r-action);
		color: var(--r-on-accent);
	}
	.row:hover .cue {
		background: var(--r-accent);
	}
	@media (max-width: 40rem) {
		.row {
			grid-template-columns: 4.5rem minmax(0, 1fr);
			gap: 1rem;
		}
		.cue {
			display: none;
		}
		.body {
			grid-template-columns: 1fr;
		}
		.title {
			font-size: var(--r-text-lg);
		}
		.num {
			grid-column: 1;
			grid-row: auto;
			text-align: left;
			margin-top: 0.35rem;
		}
		.trk {
			margin-top: 0.4rem;
		}
	}
</style>
