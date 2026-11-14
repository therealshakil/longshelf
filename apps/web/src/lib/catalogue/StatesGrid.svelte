<!--
	Every state of an element, labelled, side by side (one column on narrow screens).
	No interactive controls: seeing every state at once is calmer than toggling (DR-0001 scope cap).
-->
<script lang="ts" generics="T extends { name: string; note?: string }">
	import type { Snippet } from 'svelte';

	let {
		states,
		children,
		wide = false
	}: { states: T[]; children: Snippet<[T]>; wide?: boolean } = $props();
</script>

<ul
	class="grid list-none gap-6 p-0"
	class:states-wide={wide}
	class:states-narrow={!wide}
	aria-label="States"
>
	{#each states as state (state.name)}
		<li class="flex min-w-0 flex-col gap-2">
			<p class="text-sm font-strong text-text-muted">
				{state.name}{#if state.note}<span class="font-regular"> · {state.note}</span>{/if}
			</p>
			<div class="min-w-0 rounded-md border border-border bg-surface p-4">
				{@render children(state)}
			</div>
		</li>
	{/each}
</ul>

<style>
	.states-narrow {
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
	}
	.states-wide {
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 28rem), 1fr));
	}
</style>
