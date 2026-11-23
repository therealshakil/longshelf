<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import StatesGrid from '#lib/catalogue/StatesGrid.svelte';
	import TokenTable from '#lib/catalogue/TokenTable.svelte';
	import { byGroup, contrast, getToken, THEMES, type Theme } from '@longshelf/shared/tokens';
	import { meta } from './meta';

	const v = (name: string, theme: Theme) => (getToken(name).value as Record<Theme, string>)[theme];
	const states = [
		{ name: 'Button', note: 'shown focused' },
		{ name: 'Link', note: 'shown focused' },
		{ name: 'Text field', note: 'shown focused' }
	];
</script>

<EntryPage {meta}>
	<p>Each example below is drawn in its focused state. Press Tab to see the real ring move.</p>
	<StatesGrid {states}>
		{#snippet children(state)}
			{#if state.name === 'Button'}
				<button
					type="button"
					class="show-focus min-h-(--r-target) rounded-sm border border-control bg-raised px-4"
					>Download</button
				>
			{:else if state.name === 'Link'}
				<a href="#focus-example" class="show-focus" id="focus-example">Book details</a>
			{:else}
				<label class="flex flex-col gap-1">
					<span class="text-sm">Search your library</span>
					<input
						type="search"
						class="show-focus min-h-(--r-target) rounded-sm border border-control bg-raised px-3"
						value="lighthouse"
					/>
				</label>
			{/if}
		{/snippet}
	</StatesGrid>

	<div class="overflow-x-auto">
		<table class="w-full border-collapse text-left text-sm">
			<caption class="mb-2 text-left font-strong">Focus ring contrast</caption>
			<thead>
				<tr class="border-b border-control">
					<th scope="col" class="py-1 pr-3">Theme</th>
					{#each ['bg', 'surface', 'raised', 'accent-surface'] as bg (bg)}
						<th scope="col" class="py-1 pr-3">on {bg}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each THEMES as theme (theme)}
					<tr class="border-b border-border">
						<th scope="row" class="py-1 pr-3 font-regular">{theme}</th>
						{#each ['bg', 'surface', 'raised', 'accent-surface'] as bg (bg)}
							<td class="py-1 pr-3">{contrast(v('focus', theme), v(bg, theme)).toFixed(1)}:1</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
		<p class="mt-2 text-sm text-text-muted">Every value must be at least 3:1.</p>
	</div>

	<TokenTable tokens={[...byGroup('focus'), getToken('focus')]} caption="Focus tokens" />
</EntryPage>

<style>
	/* Draw the focus ring statically for review, using the same tokens as :focus-visible. */
	.show-focus {
		outline: var(--r-focus-width) solid var(--r-focus);
		outline-offset: var(--r-focus-offset);
	}
</style>
