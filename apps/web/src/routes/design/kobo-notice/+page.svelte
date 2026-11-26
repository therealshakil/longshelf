<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import KoboNotice from '#lib/components/KoboNotice.svelte';
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<KoboNotice device="Kobo" chapter="Chapter 41" percent={41} onGo={() => {}} onStay={() => {}} />
	<!-- Spec 004 FR-009, draft wording awaiting the owner's approval. -->
	<KoboNotice
		device="Android phone"
		chapter="Chapter 12"
		percent={22}
		further={false}
		onGo={() => {}}
		onStay={() => {}}
	/>
</EntryPage>
