<!--
	The current book on Home ("Spread", approved in live review 2026-11-18): a large cover, the title
	and author at the top, a labelled table of where you are, and Continue reading aligned to the
	cover's bottom. Matches design-mocks/index.html.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import type { BookWithPositions } from '@ribbon/shared/library';
	import { deviceName, lastReadLabel, splitPositions } from '#lib/library/format.ts';

	let { item, now = new Date() }: { item: BookWithPositions; now?: Date } = $props();

	const book = $derived(item.book);
	const pos = $derived(splitPositions(item.positions));
	const readHref = $derived(resolve('/read/[id]', { id: book.id }));
	const bookHref = $derived(resolve('/book/[id]', { id: book.id }));
</script>

<article class="current" aria-labelledby="current-title">
	<a class="cover" href={readHref} tabindex="-1" aria-hidden="true">
		{#if book.cover}<img src={book.cover.url} alt="" />{/if}
	</a>
	<div class="text">
		<div>
			<h2 id="current-title" class="title"><a href={bookHref}>{book.title}</a></h2>
			<p class="author">{book.authors[0]?.name ?? 'Unknown author'}</p>
		</div>
		<dl class="meta">
			{#if pos.here}
				<dt>Progress</dt>
				<dd class="pct">
					<b>{pos.here.percent}%</b>{pos.here.chapterLabel}
					<span class="bar" aria-hidden="true"><i style:width="{pos.here.percent}%"></i></span>
				</dd>
			{/if}
			{#if pos.other}
				<dt>Elsewhere</dt>
				<dd>{deviceName(pos.other.source)} is at {pos.other.percent}%</dd>
			{/if}
			{#if pos.here}
				<dt>Last read</dt>
				<dd>{lastReadLabel(pos.here.readAt, now)}, on this device</dd>
			{/if}
		</dl>
		<a class="go" href={readHref}
			>Continue reading <ArrowRight class="size-4" aria-hidden="true" /></a
		>
	</div>
</article>

<style>
	.current {
		display: grid;
		grid-template-columns: minmax(0, 15rem) minmax(0, 36rem);
		gap: 3.75rem;
		align-items: stretch;
	}
	.cover img {
		width: 100%;
		aspect-ratio: 2 / 3;
		object-fit: cover;
		border-radius: var(--r-radius-cover);
		box-shadow: var(--r-shadow-cover);
		background: var(--r-surface);
	}
	.text {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 2.5rem;
		padding-block: 0.25rem;
	}
	.title {
		font-size: var(--r-text-display);
		line-height: var(--r-leading-display);
		font-weight: var(--r-weight-title);
		letter-spacing: -0.015em;
		overflow-wrap: anywhere;
	}
	.title a {
		color: inherit;
		text-decoration: none;
	}
	.title a:hover {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.15em;
	}
	.author {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-lg);
		color: var(--r-text-muted);
		margin-top: 0.625rem;
	}
	.meta {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
		gap: 0.9375rem 2rem;
		align-items: baseline;
		border-top: 1px solid var(--r-border);
		padding-top: 1.5625rem;
		margin: 0;
		font-size: var(--r-text-sm);
	}
	dt {
		color: var(--r-text-muted);
		font-size: var(--r-text-xs);
	}
	dd {
		margin: 0;
		color: var(--r-text);
		font-variant-numeric: tabular-nums;
	}
	.pct b {
		color: var(--r-accent);
		font-size: var(--r-text-lg);
		margin-right: 0.5rem;
	}
	.bar {
		display: block;
		height: 0.1875rem;
		background: var(--r-border);
		margin-top: 0.5rem;
		max-width: 20rem;
	}
	.bar i {
		display: block;
		height: 100%;
		background: var(--r-accent);
	}
	.go {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		min-height: var(--r-target);
		padding: 0.65rem 1.4rem;
		border-radius: var(--r-radius-pill);
		background: var(--r-action);
		color: var(--r-on-accent);
		font-weight: var(--r-weight-strong);
		text-decoration: none;
	}
	.go:hover {
		background: var(--r-accent);
	}
	@media (max-width: 40rem) {
		.current {
			grid-template-columns: 7rem minmax(0, 1fr);
			gap: 1.25rem;
		}
		.title {
			font-size: var(--r-text-2xl);
		}
		.meta {
			grid-template-columns: 1fr;
			gap: 0.2rem;
		}
		dd {
			margin-bottom: 0.5rem;
		}
		.go {
			align-self: stretch;
			justify-content: center;
		}
	}
	/* The narrowest phones: a smaller cover and title keep long words whole. */
	@media (max-width: 22rem) {
		.current {
			grid-template-columns: 5rem minmax(0, 1fr);
			gap: 1rem;
		}
		.title {
			font-size: var(--r-text-xl);
		}
		.go {
			padding-inline: 0.75rem;
			white-space: nowrap;
		}
	}
</style>
