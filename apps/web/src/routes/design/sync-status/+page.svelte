<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import StatesGrid from '#lib/catalogue/StatesGrid.svelte';
	import SyncStatus from '#lib/components/SyncStatus.svelte';
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<StatesGrid
		states={[
			{ name: 'Up to date' },
			{ name: 'Syncing' },
			{ name: 'Offline' },
			{ name: 'Needs attention' }
		]}
	>
		{#snippet children(s)}
			<SyncStatus
				sync={s.name === 'Syncing'
					? { state: 'syncing' }
					: s.name === 'Offline'
						? { state: 'offline' }
						: s.name === 'Needs attention'
							? { state: 'attention' }
							: { state: 'up-to-date', lastSync: new Date(Date.now() - 240000).toISOString() }}
			/>
		{/snippet}
	</StatesGrid>
</EntryPage>
