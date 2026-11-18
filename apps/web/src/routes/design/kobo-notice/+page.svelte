<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import KoboNotice from '#lib/components/KoboNotice.svelte';
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<KoboNotice device="Kobo" chapter="Chapter 41" percent={41} onGo={() => {}} onStay={() => {}} />
</EntryPage>
