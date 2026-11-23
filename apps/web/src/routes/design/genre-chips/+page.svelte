<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import GenreChips from '#lib/components/GenreChips.svelte';
	import type { GenreAction, GenreState } from '@ribbon/shared/ai';
	import { meta } from './meta';

	const STATES: Record<GenreAction, GenreState> = {
		promote: 'promoted',
		remove: 'removed',
		restore: 'suggested'
	};
	const change = async (_id: string, _name: string, action: GenreAction) => STATES[action];
</script>

<EntryPage {meta}>
	<GenreChips
		bookId="sample"
		{change}
		genres={[
			{ name: 'Classics', state: 'in_calibre' },
			{ name: 'Historical Fiction', state: 'promoted' },
			{ name: 'Literary Fiction', state: 'suggested' }
		]}
	/>
</EntryPage>
