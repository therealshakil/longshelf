<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import TokenTable from '#lib/catalogue/TokenTable.svelte';
	import { byGroup, cssVar } from '@ribbon/shared/tokens';
	import { meta } from './meta';

	const space = byGroup('space');
</script>

<EntryPage {meta}>
	<TokenTable tokens={space} caption="Spacing tokens">
		{#snippet preview(t)}
			<span
				class="block h-4 rounded-sm bg-accent"
				style="inline-size: var({cssVar(t.name)})"
				aria-hidden="true"
			></span>
		{/snippet}
	</TokenTable>
</EntryPage>
