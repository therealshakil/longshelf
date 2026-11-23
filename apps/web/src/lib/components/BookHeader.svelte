<!--
	The top of a book page (approved mock design-mocks/book.html): large cover; title, author link
	and publication line; where you are on each device; then the actions. Continue reading is the
	one primary action. Download is a toggle; the More menu holds rarer actions.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Download from '@lucide/svelte/icons/download';
	import Check from '@lucide/svelte/icons/check';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import type { BookWithPositions } from '@longshelf/shared/library';
	import { deviceName, lastReadLabel, splitPositions } from '#lib/library/format.ts';

	let {
		item,
		downloaded = $bindable(false),
		headingLevel = 1,
		onMarkFinished
	}: {
		item: BookWithPositions;
		downloaded?: boolean;
		/** 1 on the book page; 2 where the page already has a main heading. */
		headingLevel?: 1 | 2;
		onMarkFinished?: () => void;
	} = $props();

	const book = $derived(item.book);
	const pos = $derived(splitPositions(item.positions));
	const author = $derived(book.authors[0]);
	let menuOpen = $state(false);
</script>

<div class="top">
	<div class="cover">
		{#if book.cover}<img src={book.cover.url} alt={book.cover.alt} />{/if}
	</div>
	<div class="main">
		<svelte:element this={`h${headingLevel}`} class="title">{book.title}</svelte:element>
		<p class="by">
			by {#if author}<a href={resolve('/library/authors/[id]', { id: author.id })}>{author.name}</a
				>{:else}Unknown author{/if}{#if book.subtitle}&nbsp;· <span>{book.subtitle}</span>{/if}
		</p>
		<p class="pub">
			{[book.pubYear && `First published ${book.pubYear}`, 'English', book.formats.join(', ')]
				.filter(Boolean)
				.join(' · ')}
		</p>
		{#if pos.here}
			<dl class="meta">
				<dt>Progress</dt>
				<dd class="pct">
					<b>{pos.here.percent}%</b>{pos.here.chapterLabel}
					<span class="bar" aria-hidden="true"><i style:width="{pos.here.percent}%"></i></span>
				</dd>
				{#if pos.other}
					<dt>Elsewhere</dt>
					<dd>{deviceName(pos.other.source)} is at {pos.other.percent}%</dd>
				{/if}
				<dt>Last read</dt>
				<dd>{lastReadLabel(pos.here.readAt)}, on this device</dd>
			</dl>
		{/if}
		<div class="actions">
			<a class="go" href={resolve('/read/[id]', { id: book.id })}
				>{item.status.kind === 'unread' ? 'Start reading' : 'Continue reading'}
				<ArrowRight class="size-4" aria-hidden="true" /></a
			>
			<button
				type="button"
				class="out"
				aria-pressed={downloaded}
				onclick={() => (downloaded = !downloaded)}
			>
				{#if downloaded}<Check class="size-4" aria-hidden="true" />Downloaded{:else}<Download
						class="size-4"
						aria-hidden="true"
					/>Download{/if}
			</button>
			<div class="more">
				<button
					type="button"
					class="icon"
					aria-label="More actions"
					aria-expanded={menuOpen}
					aria-controls="book-more"
					onclick={() => (menuOpen = !menuOpen)}
					><Ellipsis class="size-5" aria-hidden="true" /></button
				>
				{#if menuOpen}
					<ul id="book-more" class="menu">
						<li>
							<button
								type="button"
								onclick={() => {
									onMarkFinished?.();
									menuOpen = false;
								}}>Mark as finished</button
							>
						</li>
						{#if downloaded}
							<li>
								<button
									type="button"
									onclick={() => {
										downloaded = false;
										menuOpen = false;
									}}>Remove download</button
								>
							</li>
						{/if}
					</ul>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.top {
		display: grid;
		grid-template-columns: minmax(0, 16rem) minmax(0, 40rem);
		gap: 3rem;
		align-items: start;
		margin: 0.5rem 0 1rem;
	}
	.cover img {
		width: 100%;
		aspect-ratio: 2 / 3;
		object-fit: cover;
		border-radius: var(--r-radius-cover);
		box-shadow: var(--r-shadow-cover);
		background: var(--r-surface);
	}
	.title {
		font-size: clamp(2.25rem, 1.6rem + 2vw, 3.25rem);
		line-height: var(--r-leading-display);
		font-weight: var(--r-weight-title);
		letter-spacing: -0.015em;
	}
	.by {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-lg);
		color: var(--r-text-muted);
		margin-top: 0.5rem;
	}
	.by a {
		color: var(--r-ink);
		text-decoration-thickness: 1px;
	}
	.pub {
		font-size: var(--r-text-sm);
		color: var(--r-text-muted);
		margin: 0.5rem 0 1.5rem;
	}
	.meta {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
		gap: 0.9375rem 2rem;
		align-items: baseline;
		border-top: 1px solid var(--r-border);
		padding-top: 1.5rem;
		margin: 0 0 1.75rem;
		font-size: var(--r-text-sm);
	}
	dt {
		color: var(--r-text-muted);
		font-size: var(--r-text-xs);
	}
	dd {
		margin: 0;
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
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1rem;
	}
	.go {
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
	.out {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: var(--r-target);
		padding: 0 1.1rem;
		border: 1px solid var(--r-control);
		border-radius: var(--r-radius-pill);
		background: transparent;
		font: inherit;
		font-weight: var(--r-weight-strong);
		color: var(--r-ink);
		cursor: pointer;
	}
	.out:hover {
		border-color: var(--r-ink);
	}
	.more {
		position: relative;
	}
	.icon {
		display: grid;
		place-items: center;
		width: var(--r-target);
		height: var(--r-target);
		border: 0;
		border-radius: var(--r-radius-pill);
		background: transparent;
		color: var(--r-ink);
		cursor: pointer;
	}
	.icon:hover {
		background: color-mix(in oklab, var(--r-bg), var(--r-ink) 6%);
	}
	.menu {
		position: absolute;
		z-index: 10;
		top: 100%;
		left: 0;
		min-width: 12rem;
		margin: 0.25rem 0 0;
		padding: 0.35rem;
		list-style: none;
		background: var(--r-raised);
		border: 1px solid var(--r-border);
		border-radius: var(--r-radius-md);
		box-shadow: var(--r-shadow-tile);
	}
	.menu button {
		width: 100%;
		min-height: var(--r-target);
		padding: 0 0.75rem;
		border: 0;
		border-radius: var(--r-radius-sm);
		background: transparent;
		font: inherit;
		color: var(--r-text);
		text-align: start;
		cursor: pointer;
	}
	.menu button:hover {
		background: var(--r-surface);
	}
	@media (max-width: 40rem) {
		.top {
			grid-template-columns: 1fr;
			gap: 1.25rem;
		}
		.cover {
			width: 9rem;
		}
		.title {
			font-size: 1.875rem;
		}
		.meta {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.2rem;
		}
		dd {
			margin-bottom: 0.5rem;
		}
		.go {
			flex: 1 1 100%;
			justify-content: center;
		}
		.out {
			flex: 1;
			justify-content: center;
		}
	}
</style>
