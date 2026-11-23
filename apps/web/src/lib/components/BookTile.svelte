<!--
	A book in a grid: cover (fixed 2:3, so nothing shifts while it loads), title clamped to two
	lines, author, read status (FR-005), and an optional reason line for suggestions.
	A book without a cover gets a plain binding with its title.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Book, ReadStatus } from '@ribbon/shared/library';
	import { statusLabel } from '@ribbon/shared/library';

	let {
		book,
		status,
		reason,
		size = 'md'
	}: { book: Book; status?: ReadStatus; reason?: string; size?: 'sm' | 'md' } = $props();

	const href = $derived(resolve('/book/[id]', { id: book.id }));
	const label = $derived(status ? statusLabel(status) : null);
	const author = $derived(book.authors[0]?.name ?? 'Unknown author');
</script>

<div class="tile flex flex-col gap-0.5" class:tile-sm={size === 'sm'}>
	<a {href} class="cover mb-2 block no-underline" tabindex="-1" aria-hidden="true">
		{#if book.cover}
			<img src={book.cover.url} alt="" loading="lazy" />
		{:else}
			<span class="binding">{book.title}</span>
		{/if}
	</a>
	<a {href} class="title">{book.title}</a>
	<span class="{size === 'sm' ? 'text-xs' : 'text-sm'} text-text-muted">{author}</span>
	{#if label}
		<span class="status" class:status-done={status?.kind === 'finished'}>{label}</span>
	{/if}
	{#if reason}
		<span class="mt-1 {size === 'sm' ? 'text-xs' : 'text-sm'} text-accent">{reason}</span>
	{/if}
</div>

<style>
	.cover img,
	.binding {
		display: block;
		width: 100%;
		aspect-ratio: 2 / 3;
		object-fit: cover;
		border-radius: var(--r-radius-cover);
		background: var(--r-surface);
		box-shadow: var(--r-shadow-tile);
	}
	.binding {
		display: grid;
		place-items: center;
		padding: 0.75rem;
		text-align: center;
		font-family: var(--r-font-reading);
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
	}
	.title {
		font-family: var(--r-font-reading);
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
		line-height: var(--r-leading-tight);
		text-decoration: none;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.title:hover {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}
	.tile-sm .title {
		font-size: var(--r-text-sm);
	}
	.status {
		margin-top: 0.15rem;
		font-size: var(--r-text-xs);
		font-weight: var(--r-weight-strong);
		color: var(--r-accent);
		font-variant-numeric: tabular-nums;
	}
	.status-done {
		font-weight: var(--r-weight-regular);
		color: var(--r-text);
	}
</style>
