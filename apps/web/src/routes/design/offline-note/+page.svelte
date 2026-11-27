<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import OfflineNote from '#lib/components/OfflineNote.svelte';
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<p class="text-sm text-text-muted">
		Shown only while the device is offline. Switch off the network to see it.
	</p>
	<OfflineNote />
</EntryPage>
