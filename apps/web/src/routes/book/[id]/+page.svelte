<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Book · Ribbon</title>
</svelte:head>

<main class="py-8">
	<h1 class="text-2xl">Book</h1>
	<p class="mt-2 text-text-muted">
		The book page for “{page.params.id}” is built next (spec 002, user story 3).
	</p>
</main>
