<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import ReaderChrome from '#lib/components/ReaderChrome.svelte';
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<div
		class="relative h-48 [transform:translateZ(0)] overflow-hidden rounded-md border border-border"
	>
		<ReaderChrome
			title="Middlemarch"
			chapter="Book IV · Chapter 40"
			percent={38}
			other={{ device: 'Kobo', percent: 41 }}
			minutesLeft={9}
			backHref="#"
			onContents={() => {}}
			onText={() => {}}
			onBookmark={() => {}}
			onStorySoFar={() => {}}
		/>
	</div>
</EntryPage>
