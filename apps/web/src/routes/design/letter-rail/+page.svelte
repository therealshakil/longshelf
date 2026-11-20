<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import LetterRail from '#lib/components/LetterRail.svelte';
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<p class="text-text-muted">
		The rail is fixed to the right edge of this page. Letters A, C, M and S have entries.
	</p>
	<LetterRail present={new Set(['A', 'C', 'M', 'S'])} idPrefix="demo-" />
</EntryPage>
