<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import { createSampleLibrary } from '@ribbon/shared/sample';
	const lib = createSampleLibrary();
	import BookGrid from '#lib/components/BookGrid.svelte';
	import type { Book } from '@ribbon/shared/library';
	let books: Book[] = $state([]);
	$effect(() => {
		lib.allBooks().then((b) => (books = b));
	});
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<BookGrid books={books.slice(0, 8)} />
</EntryPage>
