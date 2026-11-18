<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import StatesGrid from '#lib/catalogue/StatesGrid.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<StatesGrid states={[{ name: 'Nothing in progress' }, { name: 'No results' }]}>
		{#snippet children(s)}
			{#if s.name === 'No results'}
				<EmptyState
					title="No books match “sea voyage”."
					next={{ label: 'Browse the library', href: '#' }}
				/>
			{:else}
				<EmptyState
					title="You’re not reading anything right now."
					next={{ label: 'Browse the library', href: '#' }}
				/>
			{/if}
		{/snippet}
	</StatesGrid>
</EntryPage>
