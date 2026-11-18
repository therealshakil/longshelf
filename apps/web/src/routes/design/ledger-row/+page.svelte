<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import StatesGrid from '#lib/catalogue/StatesGrid.svelte';
	import LedgerRow from '#lib/components/LedgerRow.svelte';
	import { createSampleLibrary } from '@ribbon/shared/sample';
	import type { BookWithPositions } from '@ribbon/shared/library';

	let rows: { name: string; note: string; item: BookWithPositions }[] = $state([]);
	$effect(() => {
		createSampleLibrary()
			.alsoReading(5)
			.then((list) => {
				rows = list.map((item) => ({
					name: item.book.title,
					note: item.positions.length > 1 ? 'with Kobo progress' : 'away a week or more',
					item
				}));
			});
	});
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<StatesGrid states={rows} wide>
		{#snippet children(s)}
			<ol class="m-0 list-none p-0"><LedgerRow item={s.item} onStorySoFar={() => {}} /></ol>
		{/snippet}
	</StatesGrid>
</EntryPage>
