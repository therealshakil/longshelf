<!--
	Home (spec 002 US1, FR-002): the current book, the books you're also reading, then
	suggestions (US5), a way into the library, and the latest news and magazines.
	Matches design-mocks/index.html.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import CurrentBook from '#lib/components/CurrentBook.svelte';
	import LedgerRow from '#lib/components/LedgerRow.svelte';
	import PeriodicalRow from '#lib/components/PeriodicalRow.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Ribbon</title>
</svelte:head>

<main>
	<h1 class="sr-only">Home</h1>

	{#if data.current}
		<section class="now" aria-labelledby="now-h">
			<h2 id="now-h" class="sr-only">Now reading</h2>
			<CurrentBook item={data.current} />
			{#if data.also.length}
				<div>
					<h3 class="also-h">Also reading</h3>
					<ol class="ledger">
						{#each data.also as item (item.book.id)}
							<LedgerRow {item} />
						{/each}
					</ol>
				</div>
			{/if}
		</section>
	{/if}

	<a class="more" href={resolve('/library')}
		>Browse the library <ArrowRight class="size-4" aria-hidden="true" /></a
	>

	{#if data.periodicals.length}
		<section class="latest" aria-labelledby="latest-h">
			<h2 id="latest-h" class="section-h">Latest news &amp; magazines</h2>
			<PeriodicalRow issues={data.periodicals} label="Latest issues" />
		</section>
	{/if}
</main>

<style>
	.now {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 2.5rem;
		padding: 1.75rem 0 2.5rem;
		border-bottom: 1px solid var(--r-border);
	}
	.also-h {
		font-family: var(--r-font-ui);
		font-size: var(--r-text-sm);
		font-weight: var(--r-weight-strong);
		color: var(--r-text);
		margin-bottom: 1rem;
	}
	.ledger {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.more {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 2rem;
		font-weight: var(--r-weight-strong);
		text-decoration: none;
	}
	.more:hover {
		text-decoration: underline;
	}
	.latest {
		padding: 2.25rem 0 3.5rem;
		min-width: 0;
	}
	.section-h {
		font-size: var(--r-text-xl);
		font-weight: var(--r-weight-title);
		margin-bottom: 1rem;
	}
</style>
