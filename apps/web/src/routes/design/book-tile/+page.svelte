<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import StatesGrid from '#lib/catalogue/StatesGrid.svelte';
	import BookTile from '#lib/components/BookTile.svelte';
	import { createSampleLibrary } from '@longshelf/shared/sample';
	import type { Book, ReadStatus } from '@longshelf/shared/library';

	const lib = createSampleLibrary();
	let samples: { name: string; book: Book; status: ReadStatus; reason?: string }[] = $state([]);
	$effect(() => {
		Promise.all([
			lib.book('jane-austen_emma'),
			lib.book('marcus-aurelius_meditations_george-long'),
			lib.book('jane-austen_pride-and-prejudice'),
			lib.book('virginia-woolf_mrs-dalloway')
		]).then(([a, b, c, d]) => {
			samples = [
				{ name: 'Unread', book: a!.book, status: a!.status },
				{ name: 'In progress', book: b!.book, status: b!.status },
				{ name: 'Finished', book: c!.book, status: c!.status },
				{
					name: 'Suggestion',
					note: 'with reason',
					book: d!.book,
					status: d!.status,
					reason: 'On your Reading List'
				},
				{ name: 'No cover', book: { ...a!.book, cover: undefined }, status: a!.status },
				{
					name: 'Long title',
					book: {
						...a!.book,
						title: 'The Extraordinary Adventures of Arsène Lupin, Gentleman-Burglar'
					},
					status: a!.status
				}
			] as typeof samples;
		});
	});
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<StatesGrid states={samples}>
		{#snippet children(s)}
			<div class="max-w-40"><BookTile book={s.book} status={s.status} reason={s.reason} /></div>
		{/snippet}
	</StatesGrid>
</EntryPage>
