<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import StatesGrid from '#lib/catalogue/StatesGrid.svelte';
	import AppHeader from '#lib/components/AppHeader.svelte';
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<StatesGrid
		states={[{ name: 'Home current' }, { name: 'Library current' }, { name: 'Offline' }]}
		wide
	>
		{#snippet children(s)}
			<AppHeader
				current={s.name === 'Library current' ? 'library' : 'home'}
				sync={s.name === 'Offline'
					? { state: 'offline' }
					: { state: 'up-to-date', lastSync: new Date(Date.now() - 240000).toISOString() }}
			/>
		{/snippet}
	</StatesGrid>
</EntryPage>
