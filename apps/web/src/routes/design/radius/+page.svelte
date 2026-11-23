<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import TokenTable from '#lib/catalogue/TokenTable.svelte';
	import { byGroup, cssVar } from '@longshelf/shared/tokens';
	import { meta } from './meta';

	const radius = byGroup('radius');
</script>

<EntryPage {meta}>
	<TokenTable tokens={radius} caption="Corner tokens">
		{#snippet preview(t)}
			<span
				class="block size-16 border-2 border-control bg-raised"
				style="border-radius: var({cssVar(t.name)})"
				aria-hidden="true"
			></span>
		{/snippet}
	</TokenTable>
</EntryPage>
