<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import { createSampleLibrary } from '@longshelf/shared/sample';
	const lib = createSampleLibrary();
	import BookHeader from '#lib/components/BookHeader.svelte';
	import type { BookPage } from '@longshelf/shared/library';
	let item: BookPage | null = $state(null);
	$effect(() => {
		lib.book('george-eliot_middlemarch').then((b) => (item = b));
	});
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	{#if item}<BookHeader {item} headingLevel={2} />{/if}
</EntryPage>
