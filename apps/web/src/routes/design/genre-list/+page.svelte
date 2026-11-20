<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import GenreList from '#lib/components/GenreList.svelte';
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<GenreList
		genres={[
			{
				kind: 'genre',
				id: 'classic-novels',
				name: 'Classic novels',
				count: 41,
				suggested: 29,
				sample: []
			},
			{ kind: 'genre', id: 'gothic', name: 'Gothic & horror', count: 11, suggested: 4, sample: [] },
			{ kind: 'genre', id: 'philosophy', name: 'Philosophy', count: 14, suggested: 14, sample: [] }
		]}
	/>
</EntryPage>
