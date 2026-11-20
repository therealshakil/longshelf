<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import { createSampleLibrary } from '@ribbon/shared/sample';
	const lib = createSampleLibrary();
	import AuthorList from '#lib/components/AuthorList.svelte';
	import type { Author } from '@ribbon/shared/library';
	let authors: { author: Author; bookCount: number }[] = $state([]);
	$effect(() => {
		lib.authors().then((a) => (authors = a));
	});
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<AuthorList authors={authors.slice(0, 12)} />
</EntryPage>
