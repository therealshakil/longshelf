<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import LibraryTabs, { type TabId } from '#lib/components/LibraryTabs.svelte';
	let tab: TabId = $state('recent');
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<LibraryTabs current={tab} onSelect={(id) => (tab = id)}>
		{#snippet panel(id)}<p class="text-text-muted">
				The “{id}” tab’s content shows here.
			</p>{/snippet}
	</LibraryTabs>
</EntryPage>
