<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import { createSampleLibrary } from '@ribbon/shared/sample';
	const lib = createSampleLibrary();
	import CollectionStack from '#lib/components/CollectionStack.svelte';
	import type { ShelfSummary } from '@ribbon/shared/library';
	let shelves: ShelfSummary[] = $state([]);
	$effect(() => {
		lib.shelves('collection').then((s) => (shelves = s));
	});
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<div class="flex flex-wrap gap-8">
		{#each shelves.slice(0, 3) as shelf (shelf.id)}<CollectionStack {shelf} />{/each}
	</div>
</EntryPage>
