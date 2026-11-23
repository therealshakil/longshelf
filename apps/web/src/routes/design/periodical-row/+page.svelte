<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import PeriodicalRow from '#lib/components/PeriodicalRow.svelte';
	import { createSampleLibrary } from '@longshelf/shared/sample';
	import type { PeriodicalIssue } from '@longshelf/shared/library';

	let issues: PeriodicalIssue[] = $state([]);
	$effect(() => {
		createSampleLibrary()
			.latestPeriodicals()
			.then((i) => (issues = i));
	});
	import { meta } from './meta';
</script>

<EntryPage {meta}>
	<PeriodicalRow {issues} label="Latest issues" />
</EntryPage>
