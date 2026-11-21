<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import StorySoFar from '#lib/components/StorySoFar.svelte';
	import type { RecapView } from '#lib/ai/recap.ts';
	import { meta } from './meta';

	// Sample text: written for the catalogue from Moby Dick (public domain), chapters 1 to 2.
	const states: { name: string; recap: RecapView; percent: number }[] = [
		{
			name: 'Ready',
			percent: 12,
			recap: {
				state: 'ready',
				upto: { label: 'Chapter 3. The Spouter-Inn', percent: 12 },
				paragraphs: [
					'Ishmael goes to sea whenever he feels low. Rather than travel as a passenger, he signs on as a common sailor, and this time he means to go whaling.',
					'He leaves Manhattan for New Bedford with a carpet-bag, misses the boat to Nantucket, and looks for a cheap bed on a cold December night, ending up at the Spouter-Inn.'
				],
				note: 'Written by AI from the book’s text up to your place, so it won’t spoil what comes next. It can get details wrong.'
			}
		},
		{
			name: 'Recent chapters only',
			percent: 68,
			recap: {
				state: 'ready',
				upto: { label: 'Chapter 3. The Spouter-Inn', percent: 68 },
				paragraphs: [
					'He leaves Manhattan for New Bedford with a carpet-bag, misses the boat to Nantucket, and looks for a cheap bed on a cold December night, ending up at the Spouter-Inn.'
				],
				note: 'Written by AI from the book’s text up to your place, so it won’t spoil what comes next. It can get details wrong.',
				earlier: { percent: 25, days: 1 },
				coverage: {
					fromLabel: 'Chapter 2. The Carpet-Bag',
					toLabel: 'Chapter 2. The Carpet-Bag',
					limited: false
				}
			}
		},
		{ name: 'Writing', percent: 12, recap: { state: 'loading' } },
		{
			name: 'Unavailable',
			percent: 12,
			recap: {
				state: 'unavailable',
				reason:
					'Couldn’t write a recap right now. You’re offline, and recaps need a connection. It will be ready next time you open this book online.'
			}
		},
		{
			name: 'Too early',
			percent: 3,
			recap: {
				state: 'too_early',
				reason: 'Not much to recap yet. A recap starts making sense after about 5%.'
			}
		}
	];
	let openName = $state<string | null>(null);
</script>

<EntryPage {meta}>
	<div class="flex flex-wrap gap-3">
		{#each states as s (s.name)}
			<button
				type="button"
				class="rounded-pill border border-control px-4 py-2"
				onclick={() => (openName = s.name)}>{s.name}</button
			>
		{/each}
	</div>
	{#each states as s (s.name)}
		<StorySoFar
			bind:open={() => openName === s.name, (v) => (openName = v ? s.name : null)}
			title="Moby Dick"
			author="Herman Melville"
			place={{ label: 'Chapter 3. The Spouter-Inn', percent: s.percent }}
			awayDays={12}
			recap={s.recap}
			continueHref="#"
			onIncludeEarlier={() => {}}
		/>
	{/each}
</EntryPage>
