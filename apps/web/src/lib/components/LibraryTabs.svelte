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
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';

	let {
		current,
		onSelect,
		panel
	}: { current: TabId; onSelect: (id: TabId) => void; panel: Snippet<[TabId]> } = $props();

	let links: HTMLAnchorElement[] = $state([]);

	/** Once interactive, switch in place and keep focus; a new-tab click stays a normal link. */
	function click(e: MouseEvent, id: TabId, i: number) {
		if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		e.preventDefault();
		onSelect(id);
		links[i]?.focus();
	}

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
		links[to]?.focus();
	}
</script>

<div class="tabs" role="tablist" aria-label="Browse the library">
	{#each TABS as tab, i (tab.id)}
		<!-- A real link, so a tap works before the page is interactive. -->
		<a
			bind:this={links[i]}
			href="{resolve('/library')}{tab.id === 'recent' ? '' : `?tab=${tab.id}`}"
			role="tab"
			id="tab-{tab.id}"
			aria-selected={current === tab.id}
			aria-controls="panel-{tab.id}"
			tabindex={current === tab.id ? 0 : -1}
			onclick={(e) => click(e, tab.id, i)}
			onkeydown={(e) => key(e, i)}>{tab.label}</a
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
	a {
		display: inline-block;
		text-decoration: none;
		padding: 0.7rem 0;
		border: 0;
		border-bottom: 0.125rem solid transparent;
		margin-bottom: -1px;
		background: transparent;
		font: inherit;
		font-weight: var(--r-weight-strong);
		color: var(--r-text-muted);
		white-space: nowrap;
	}
	a:hover {
		color: var(--r-ink);
	}
	a[aria-selected='true'] {
		color: var(--r-ink);
		border-color: var(--r-accent);
	}
	[role='tabpanel']:focus {
		outline: none;
	}
</style>
