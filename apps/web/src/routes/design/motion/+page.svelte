<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import TokenTable from '#lib/catalogue/TokenTable.svelte';
	import { byGroup } from '@ribbon/shared/tokens';
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<div class="flex flex-col gap-3 rounded-md bg-surface p-4">
		<p class="font-strong">There is nothing to show here, on purpose.</p>
		<p>
			Where other apps would fade, slide or spin, Ribbon changes instantly. Progress is shown as
			words (“Syncing 3 of 12 books”), never as a spinner.
		</p>
		<p>
			One exception: in the reader, the bars slide away or back when you tap the page. You started
			it, it lasts a fifth of a second, and it is off when your system asks for reduced motion.
		</p>
	</div>
	<TokenTable tokens={byGroup('motion')} caption="Motion token" />
</EntryPage>
