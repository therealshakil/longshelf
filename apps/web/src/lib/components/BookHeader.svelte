<!--
	The top of a book page (approved mock design-mocks/book.html): large cover; title, author link
	and publication line; where you are on each device; then the actions. Continue reading is the
	one primary action. Download keeps the book on this device (spec 004, DownloadButton); the More
	menu holds rarer actions, including Remove download.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import DownloadButton from '#lib/components/DownloadButton.svelte';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import { READABLE_FORMATS, type BookWithPositions } from '@longshelf/shared/library';
	import { deviceName, lastReadLabel, splitPositions } from '#lib/library/format.ts';

	let {
		item,
		file = null,
		headingLevel = 1,
		onMarkFinished
	}: {
		item: BookWithPositions;
		/** The file the reader opens, for Download (spec 004). */
		file?: { url: string; format: string; size?: number } | null;
		/** 1 on the book page; 2 where the page already has a main heading. */
		headingLevel?: 1 | 2;
		onMarkFinished?: () => void;
	} = $props();

	const book = $derived(item.book);
	const pos = $derived(splitPositions(item.positions));
	const author = $derived(book.authors[0]);
	/** Spec 003 US2 scenario 4: no EPUB or KEPUB means no Read action, and a plain reason. */
	const readable = $derived(book.formats.some((f) => READABLE_FORMATS.includes(f)));
	let menuOpen = $state(false);
	let downloaded = $state(false);
	let downloader = $state<ReturnType<typeof DownloadButton> | null>(null);
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
					<dd>{deviceName(pos.other)} is at {pos.other.percent}%</dd>
				{/if}
				<dt>Last read</dt>
				<dd>{lastReadLabel(pos.here.readAt)}, on this device</dd>
			</dl>
		{/if}
		<div class="actions">
			{#if readable}
				<a class="go" href={resolve('/read/[id]', { id: book.id })}
					>{item.status.kind === 'unread' ? 'Start reading' : 'Continue reading'}
					<ArrowRight class="size-4" aria-hidden="true" /></a
				>
			{:else}
				<p class="unreadable">
					{book.formats.length
						? `Can’t be read here (${book.formats.join(', ')}). Save a copy from Details.`
						: 'There’s no book file in Calibre.'}
				</p>
			{/if}
			{#if readable}
				<DownloadButton
					bind:this={downloader}
					bind:downloaded
					book={{ id: book.id, title: book.title }}
					{file}
				/>
			{/if}
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
						<li>
							<a href={resolve('/settings/storage')}>Downloads on this device</a>
						</li>
						{#if downloaded}
							<li>
								<button
									type="button"
									onclick={async () => {
										menuOpen = false;
										await downloader?.removeDownload();
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
	.unreadable {
		color: var(--r-text-muted);
		max-width: 22rem;
	}
	.go:hover {
		background: var(--r-accent);
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
	.menu a {
		display: flex;
		align-items: center;
		min-height: var(--r-target);
		padding: 0 0.75rem;
		border-radius: var(--r-radius-sm);
		color: var(--r-text);
		text-decoration: none;
	}
	.menu a:hover {
		background: var(--r-surface);
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
	}
</style>
