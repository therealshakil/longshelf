<!-- Any page that can't open: what happened, that nothing was lost, and one way back (FR-016). -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ErrorState from '#lib/components/ErrorState.svelte';

	const missing = $derived(page.status === 404);
	const what = $derived(
		missing
			? page.error?.message && page.error.message !== 'Not Found'
				? page.error.message
				: 'That page isn’t in Ribbon.'
			: 'Ribbon couldn’t open this page.'
	);
</script>

<svelte:head>
	<title>{missing ? 'Not found' : 'Something went wrong'} · Ribbon</title>
</svelte:head>

<main class="page">
	<h1>{missing ? 'Not found' : 'Something went wrong'}</h1>
	<ErrorState
		{what}
		lost="Your books and reading places are safe."
		next={{ label: 'Go to your library', href: resolve('/library') }}
	/>
</main>

<style>
	.page {
		max-width: 40rem;
		padding: 2rem 0 4rem;
	}
	h1 {
		font-size: var(--r-text-2xl);
		font-weight: var(--r-weight-title);
		margin-bottom: 1rem;
	}
</style>
