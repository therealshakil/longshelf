<!-- A responsive grid of book tiles; covers keep their ratio so nothing shifts while loading. -->
<script lang="ts">
	import type { Book, ReadStatus } from '@ribbon/shared/library';
	import BookTile from './BookTile.svelte';

	let {
		books,
		statuses = {},
		label
	}: { books: Book[]; statuses?: Record<string, ReadStatus>; label?: string } = $props();
</script>

<ul class="grid" aria-label={label}>
	{#each books as book (book.id)}
		<li><BookTile {book} status={statuses[book.id]} /></li>
	{/each}
</ul>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
		gap: 1.75rem 1.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		max-inline-size: none;
	}
	@media (max-width: 40rem) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1.25rem 0.9rem;
		}
	}
</style>
