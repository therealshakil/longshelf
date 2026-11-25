<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import StatesGrid from '#lib/catalogue/StatesGrid.svelte';
	import DownloadButton from '#lib/components/DownloadButton.svelte';
	import { DownloadError } from '#lib/offline/downloads.ts';
	import { meta } from './meta';

	const book = { id: 'george-eliot_middlemarch', title: 'Middlemarch' };
	const file = {
		url: '/sample/books/george-eliot_middlemarch.epub',
		format: 'EPUB',
		size: 2_100_000
	};
	type Preview = NonNullable<Parameters<typeof DownloadButton>[1]['preview']>;
	const states: { name: string; preview: Preview }[] = [
		{ name: 'Not downloaded', preview: { state: 'none' } },
		{
			name: 'Downloading',
			preview: { state: 'none', progress: { received: 960_000, total: 2_100_000 } }
		},
		{ name: 'On this device', preview: { state: 'downloaded', size: 2_100_000 } },
		{ name: 'Newer copy in your library', preview: { state: 'update' } },
		{
			name: 'Not enough space',
			preview: { state: 'none', failure: new DownloadError('no-space', 2_100_000) }
		},
		{ name: 'Offline', preview: { state: 'none', online: false } },
		{ name: 'Download stopped', preview: { state: 'none', failure: new DownloadError('failed') } }
	];
</script>

<EntryPage {meta}>
	<StatesGrid {states}>
		{#snippet children(s)}
			<DownloadButton {book} {file} preview={s.preview} />
		{/snippet}
	</StatesGrid>
</EntryPage>
