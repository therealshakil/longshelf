<!--
	Suggestions from the owner's library (spec 002 US5): Read next on Home, More like this on a
	book page. Each book says why it is here and can be hidden for now or for good. The undo line
	stays until the owner leaves or acts again, so nothing has to be caught in time.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { DropdownMenu } from 'bits-ui';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import BookTile from './BookTile.svelte';
	import {
		dismissBook,
		loadSuggestions,
		undoDismissBook,
		type DismissKind,
		type ShelfItem
	} from '#lib/ai/suggestions.ts';

	let {
		title,
		items: initial,
		url,
		variant = 'home'
	}: { title: string; items: ShelfItem[]; url: string; variant?: 'home' | 'book' } = $props();

	const headingId = $derived(`${variant}-suggestions-h`);
	let items = $derived(initial);
	let hidden = $state<{ item: ShelfItem; kind: DismissKind; before: ShelfItem[] } | null>(null);
	let problem = $state('');
	let undoButton = $state<HTMLButtonElement | null>(null);
	let latest = 0;

	/** Fill the free place from the server, unless a newer action has started. */
	async function refresh(run: number) {
		const fresh = await loadSuggestions(fetch, url);
		if (run === latest && fresh.length) items = fresh;
	}

	async function hide(item: ShelfItem, kind: DismissKind) {
		const run = ++latest;
		const before = items;
		items = items.filter((i) => i.book.id !== item.book.id);
		hidden = { item, kind, before };
		problem = '';
		await tick();
		undoButton?.focus();
		if (await dismissBook(item.book.id, kind)) return refresh(run);
		if (run !== latest) return;
		items = before;
		hidden = null;
		problem = `Couldn’t hide ${item.book.title}. Check your connection and try again.`;
	}

	async function undo() {
		if (!hidden) return;
		const { item, before } = hidden;
		const run = ++latest;
		problem = '';
		if (!(await undoDismissBook(item.book.id))) {
			if (run === latest) problem = 'Couldn’t undo that. Check your connection and try again.';
			return;
		}
		if (run !== latest) return;
		hidden = null;
		items = before;
		await refresh(run);
	}
</script>

{#if items.length || hidden || problem}
	<section class="shelf-section {variant}" aria-labelledby={headingId}>
		<h2 id={headingId}>{title}</h2>
		<p class="notice" role="status">
			{#if problem}
				<span>{problem}</span>
			{:else if hidden}
				<span>
					{hidden.item.book.title}
					{hidden.kind === 'not_now' ? 'hidden for 30 days.' : 'won’t be suggested again.'}
				</span>
			{/if}
			{#if hidden}
				<button bind:this={undoButton} type="button" onclick={undo}>Undo</button>
			{/if}
		</p>
		{#if items.length}
			<ol class="shelf">
				{#each items as item (item.book.id)}
					<li>
						<BookTile book={item.book} reason={item.reason} size="sm" />
						<DropdownMenu.Root>
							<DropdownMenu.Trigger class="options" aria-label="Options for {item.book.title}">
								<Ellipsis class="size-5" aria-hidden="true" />
							</DropdownMenu.Trigger>
							<DropdownMenu.Portal>
								<DropdownMenu.Content
									forceMount
									align="end"
									sideOffset={4}
									collisionPadding={16}
									onCloseAutoFocus={(e) => {
										if (hidden?.item.book.id === item.book.id) e.preventDefault();
									}}
								>
									{#snippet child({ wrapperProps, props, open })}
										{#if open}
											<div {...wrapperProps} class="pick-wrap">
												<div {...props} class="pick">
													<DropdownMenu.Item
														class="pick-item"
														onSelect={() => hide(item, 'not_now')}
													>
														Not now<small>Hide for 30 days</small>
													</DropdownMenu.Item>
													<DropdownMenu.Item class="pick-item" onSelect={() => hide(item, 'never')}>
														Never suggest<small>Until you undo it</small>
													</DropdownMenu.Item>
												</div>
											</div>
										{/if}
									{/snippet}
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						</DropdownMenu.Root>
					</li>
				{/each}
			</ol>
		{/if}
	</section>
{/if}

<style>
	.shelf-section {
		min-width: 0;
	}
	.home {
		padding: 2rem 0 2.5rem;
		border-bottom: 1px solid var(--r-border);
	}
	h2 {
		font-size: var(--r-text-xl);
		font-weight: var(--r-weight-title);
		margin-bottom: 1rem;
	}
	.book h2 {
		margin-top: 2.5rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--r-border);
	}
	.notice {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.75rem;
		max-inline-size: none;
		margin: -0.35rem 0 1rem;
		font-size: var(--r-text-sm);
		color: var(--r-text);
	}
	.notice:empty {
		display: none;
	}
	.notice button {
		min-height: 1.5rem;
		font-weight: var(--r-weight-strong);
		color: var(--r-accent);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
		cursor: pointer;
	}
	.shelf {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 1.75rem 1.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.book .shelf {
		grid-template-columns: repeat(5, minmax(0, 1fr));
	}
	li {
		position: relative;
		min-width: 0;
		max-inline-size: none;
	}
	li :global(.options) {
		position: absolute;
		top: 0.35rem;
		right: 0.35rem;
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		color: var(--r-ink);
		background: color-mix(in oklab, var(--r-bg) 88%, transparent);
		box-shadow: 0 1px 3px #0003;
		opacity: 0;
		cursor: pointer;
	}
	li:is(:hover, :focus-within) :global(.options),
	li :global(.options[data-state='open']) {
		opacity: 1;
	}
	li :global(.options:hover),
	li :global(.options[data-state='open']) {
		background: var(--r-bg);
	}
	.pick {
		width: 13rem;
		padding: 0.3rem;
		background: var(--r-bg);
		border: 1px solid var(--r-border);
		border-radius: var(--r-radius-sm);
		box-shadow: 0 10px 28px -10px #0007;
		/* The highlighted item carries the focus ring. */
		outline: none;
	}
	.pick :global(.pick-item) {
		display: block;
		min-height: 2.75rem;
		padding: 0.45rem 0.65rem;
		border-radius: 0.25rem;
		color: var(--r-ink);
		font-size: var(--r-text-sm);
		font-weight: var(--r-weight-strong);
		line-height: 1.25;
		cursor: pointer;
		outline: none;
	}
	.pick :global(.pick-item small) {
		display: block;
		font-size: var(--r-text-xs);
		font-weight: var(--r-weight-regular);
		color: var(--r-text-muted);
	}
	.pick :global(.pick-item[data-highlighted]) {
		background: var(--r-surface);
		outline: 3px solid var(--r-focus);
		outline-offset: -3px;
	}
	@media (hover: none) {
		li :global(.options) {
			opacity: 1;
		}
	}
	@media (max-width: 64rem) {
		.shelf,
		.book .shelf {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	@media (max-width: 40rem) {
		.shelf,
		.book .shelf {
			grid-template-columns: none;
			grid-auto-flow: column;
			grid-auto-columns: 7.5rem;
			overflow-x: auto;
			padding-bottom: 0.5rem;
		}
		.shelf {
			grid-template-rows: auto auto;
		}
		.book .shelf {
			grid-template-rows: auto;
		}
		.pick-wrap {
			position: fixed !important;
			inset: auto 1rem 1rem 1rem !important;
			transform: none !important;
			min-width: 0 !important;
		}
		.pick {
			width: auto;
			padding: 0.4rem;
			box-shadow: 0 12px 40px -6px #0009;
		}
		.pick :global(.pick-item) {
			min-height: 3.25rem;
		}
	}
</style>
