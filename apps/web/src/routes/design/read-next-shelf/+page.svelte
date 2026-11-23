<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import ReadNextShelf from '#lib/components/ReadNextShelf.svelte';
	import type { ShelfItem } from '#lib/ai/suggestions.ts';
	import { createSampleLibrary } from '@ribbon/shared/sample';
	import { meta } from './meta';

	const lib = createSampleLibrary();
	const reasons = ['On your Reading List', 'Another by this author', 'Like Middlemarch'];
	let items: ShelfItem[] = $state([]);
	$effect(() => {
		lib.allBooks().then((books) => {
			items = books.slice(0, 12).map((book, i) => ({ book, reason: reasons[i % 3] }));
		});
	});
</script>

<EntryPage {meta}>
	{#if items.length}
		<ReadNextShelf title="Read next" {items} url="/api/ai/read-next" />
		<ReadNextShelf
			title="More like this in your library"
			items={items.slice(0, 5)}
			url="/api/ai/more-like/george-eliot_middlemarch"
			variant="book"
		/>
	{/if}
</EntryPage>
