<!--
	The Library's tabs, in a fixed order (FR-003). The chosen tab lives in the URL (?tab=), so Back
	and reload keep your place. Keyboard follows the ARIA tabs pattern: arrows move, Home and End
	jump.
-->
<script lang="ts" module>
	export const TABS = [
		{ id: 'recent', label: 'Recently added' },
		{ id: 'authors', label: 'Authors' },
		{ id: 'genres', label: 'Genres' },
		{ id: 'collections', label: 'Collections' },
		{ id: 'news', label: 'News & magazines' },
		{ id: 'all', label: 'All Books' }
	] as const;
	export type TabId = (typeof TABS)[number]['id'];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		current,
		onSelect,
		panel
	}: { current: TabId; onSelect: (id: TabId) => void; panel: Snippet<[TabId]> } = $props();

	let buttons: HTMLButtonElement[] = $state([]);

	function key(e: KeyboardEvent, i: number) {
		const n = TABS.length;
		const to =
			e.key === 'ArrowRight'
				? (i + 1) % n
				: e.key === 'ArrowLeft'
					? (i - 1 + n) % n
					: e.key === 'Home'
						? 0
						: e.key === 'End'
							? n - 1
							: -1;
		if (to < 0) return;
		e.preventDefault();
		onSelect(TABS[to].id);
		buttons[to]?.focus();
	}
</script>

<div class="tabs" role="tablist" aria-label="Browse the library">
	{#each TABS as tab, i (tab.id)}
		<button
			bind:this={buttons[i]}
			type="button"
			role="tab"
			id="tab-{tab.id}"
			aria-selected={current === tab.id}
			aria-controls="panel-{tab.id}"
			tabindex={current === tab.id ? 0 : -1}
			onclick={() => onSelect(tab.id)}
			onkeydown={(e) => key(e, i)}>{tab.label}</button
		>
	{/each}
</div>
<div role="tabpanel" id="panel-{current}" aria-labelledby="tab-{current}" tabindex="-1">
	{@render panel(current)}
</div>

<style>
	.tabs {
		display: flex;
		gap: 1.75rem;
		border-bottom: 1px solid var(--r-border);
		margin-bottom: 1.25rem;
		overflow-x: auto;
		scrollbar-width: none;
	}
	button {
		padding: 0.7rem 0;
		border: 0;
		border-bottom: 0.125rem solid transparent;
		margin-bottom: -1px;
		background: transparent;
		font: inherit;
		font-weight: var(--r-weight-strong);
		color: var(--r-text-muted);
		white-space: nowrap;
		cursor: pointer;
	}
	button:hover {
		color: var(--r-ink);
	}
	button[aria-selected='true'] {
		color: var(--r-ink);
		border-color: var(--r-accent);
	}
	[role='tabpanel']:focus {
		outline: none;
	}
</style>
