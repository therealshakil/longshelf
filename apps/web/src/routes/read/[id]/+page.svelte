<!-- Reader stub (spec 002 T021): replaced by the full reader in US2 (T030). -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.book?.book.title ?? 'Book'} · Reading · Ribbon</title>
</svelte:head>

<main class="mx-auto max-w-[36rem] px-4 py-16">
	{#if data.book}
		<h1 class="text-2xl">{data.book.book.title}</h1>
		<p class="mt-2 text-text-muted">
			Opens at {data.book.positions[0]?.chapterLabel ?? 'the start'} ({data.book.positions[0]
				?.percent ?? 0}%). The reader is built next (spec 002, user story 2).
		</p>
		<p class="mt-4"><a href={resolve('/')}>Back to Home</a></p>
	{:else}
		<p>That book isn’t in your library.</p>
		<p class="mt-4"><a href={resolve('/library')}>Browse the library</a></p>
	{/if}
</main>
