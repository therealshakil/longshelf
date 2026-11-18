<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import ContentsPanel from '#lib/components/ContentsPanel.svelte';

	let open = $state(false);
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<button
		type="button"
		class="rounded-pill border border-control px-4 py-2"
		onclick={() => (open = true)}>Open contents</button
	>
	<ContentsPanel
		bind:open
		title="Middlemarch"
		toc={[
			{
				label: 'Book IV: Three Love Problems',
				href: 'b4',
				subitems: [
					{ label: 'Chapter XXXIX', href: 'c39' },
					{ label: 'Chapter XL', href: 'c40' },
					{ label: 'Chapter XLI', href: 'c41' }
				]
			}
		]}
		currentHref="c40"
		onPick={() => {}}
	/>
</EntryPage>
