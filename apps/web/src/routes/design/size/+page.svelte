<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import TokenTable from '#lib/catalogue/TokenTable.svelte';
	import { byGroup } from '@ribbon/shared/tokens';
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<div class="flex flex-wrap items-center gap-4">
		<span
			class="inline-flex size-(--r-target) items-center justify-center rounded-sm border-2 border-dashed border-control text-sm"
			>44</span
		>
		<span
			class="inline-flex min-h-(--r-target) items-center rounded-sm border border-control bg-raised px-4"
			>Continue reading</span
		>
	</div>
	<TokenTable tokens={byGroup('size')} caption="Target size token" />
</EntryPage>
