<!-- Search results: one link per book, with its cover, title, author and why it matched. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { SearchHit } from '#lib/search/book-search.ts';

	let { items }: { items: SearchHit[] } = $props();
</script>

<ol class="results" aria-label="Search results">
	{#each items as { book, reason } (book.id)}
		<li>
			<a class="row" href={resolve('/book/[id]', { id: book.id })}>
				<span class="cover" aria-hidden="true">
					{#if book.cover}<img src={book.cover.url} alt="" loading="lazy" />{/if}
				</span>
				<span class="text">
					<span class="main">
						<span class="title">{book.title}</span>
						<span class="author"
							>{book.authors.map((a) => a.name).join(', ') || 'Unknown author'}</span
						>
					</span>
					<span class="reason">{reason}</span>
				</span>
			</a>
		</li>
	{/each}
</ol>

<style>
	.results {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		max-inline-size: none;
		border-bottom: 1px solid var(--r-border);
	}
	.row {
		display: flex;
		align-items: center;
		gap: 1.125rem;
		padding: 0.75rem 0;
		text-decoration: none;
	}
	.cover {
		flex: none;
		display: block;
		width: 3.75rem;
		aspect-ratio: 2 / 3;
		border-radius: var(--r-radius-cover);
		background: var(--r-surface);
		box-shadow: var(--r-shadow-tile);
		overflow: hidden;
	}
	.cover img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.25rem 1.5rem;
	}
	.main {
		flex: 1 1 15rem;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
	.title {
		font-family: var(--r-font-reading);
		font-size: 1.125rem;
		font-weight: var(--r-weight-title);
		line-height: var(--r-leading-tight);
		color: var(--r-ink);
	}
	.row:hover .title {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.18em;
	}
	.author,
	.reason {
		font-size: var(--r-text-sm);
	}
	.author {
		color: var(--r-text-muted);
	}
	.reason {
		color: var(--r-accent);
	}
</style>
