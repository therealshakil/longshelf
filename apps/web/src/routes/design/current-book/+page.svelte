<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import CurrentBook from '#lib/components/CurrentBook.svelte';
	import { createSampleLibrary } from '@ribbon/shared/sample';
	import type { BookWithPositions } from '@ribbon/shared/library';

	let current: BookWithPositions | null = $state(null);
	$effect(() => {
		createSampleLibrary()
			.current()
			.then((c) => (current = c));
	});
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	{#if current}<CurrentBook item={current} />{/if}
</EntryPage>
