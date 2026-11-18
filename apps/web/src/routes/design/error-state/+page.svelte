<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import ErrorState from '#lib/components/ErrorState.svelte';
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<ErrorState
		what="This book isn’t on this device, and you’re offline."
		lost="Nothing is lost. Your place is saved."
		next={{ label: 'Back to Home', href: '#' }}
	/>
</EntryPage>
