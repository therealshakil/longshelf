<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import SearchResults from '#lib/components/SearchResults.svelte';
	import { createBookSearch, type SearchHit } from '#lib/search/book-search.ts';
	import { createSampleLibrary } from '@ribbon/shared/sample';
	import { meta } from './meta';

	let items: SearchHit[] = $state([]);
	$effect(() => {
		createSampleLibrary()
			.allBooks()
			.then((books) => (items = createBookSearch(books)('war').items));
	});
</script>

<EntryPage {meta}>
	<SearchResults {items} />
</EntryPage>
