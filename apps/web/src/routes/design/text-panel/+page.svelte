<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import TextPanel from '#lib/components/TextPanel.svelte';
	import { DEFAULTS } from '#lib/reader/settings.ts';

	let open = $state(false);
	let settings = $state({ ...DEFAULTS });
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<button
		type="button"
		class="rounded-pill border border-control px-4 py-2"
		onclick={() => (open = true)}>Open text settings</button
	>
	<TextPanel bind:open bind:settings />
</EntryPage>
