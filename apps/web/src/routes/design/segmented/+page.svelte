<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import Segmented from '#lib/components/Segmented.svelte';

	let spacing = $state('normal');
	let theme = $state('system');
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<div class="flex flex-col gap-6">
		<Segmented
			legend="Line spacing"
			name="demo-spacing"
			bind:value={spacing}
			options={[
				{ value: 'tight', label: 'Tight' },
				{ value: 'normal', label: 'Normal' },
				{ value: 'loose', label: 'Loose' }
			]}
		/>
		<Segmented
			legend="Theme"
			name="demo-theme"
			bind:value={theme}
			options={[
				{ value: 'system', label: 'Match system' },
				{ value: 'paper', label: 'Paper' },
				{ value: 'night', label: 'Night' }
			]}
		/>
	</div>
</EntryPage>
