<!--
	Contents, in a sheet from the left. Grouped as the book groups them; the current chapter is
	marked by text and a tint, not colour alone.
-->
<script lang="ts">
	import * as Sheet from '#lib/components/ui/sheet/index.ts';
	import type { TocItem } from '#lib/reader/foliate.d.ts';

	let {
		open = $bindable(false),
		title,
		toc,
		currentHref,
		onPick
	}: {
		open?: boolean;
		title: string;
		toc: TocItem[];
		currentHref?: string;
		onPick: (href: string) => void;
	} = $props();

	const same = (a?: string, b?: string) => !!a && !!b && a.split('#')[0] === b.split('#')[0];
</script>

{#snippet items(list: TocItem[], depth: number)}
	{#each list as item (item.href + item.label)}
		<li>
			<button
				type="button"
				class="toc-item"
				style:padding-inline-start="{0.6 + depth * 1}rem"
				aria-current={same(item.href, currentHref) ? 'location' : undefined}
				onclick={() => {
					onPick(item.href);
					open = false;
				}}
			>
				<span>{item.label}</span>
				{#if same(item.href, currentHref)}<span class="here">You’re here</span>{/if}
			</button>
			{#if item.subitems?.length}
				<ol class="m-0 list-none p-0">{@render items(item.subitems, depth + 1)}</ol>
			{/if}
		</li>
	{/each}
{/snippet}

<Sheet.Root bind:open>
	<Sheet.Content side="left" class="w-full gap-0 bg-bg p-0 sm:max-w-[26rem]">
		<Sheet.Header class="px-6 pt-6 pb-2">
			<Sheet.Title class="font-reading text-2xl font-title text-ink">Contents</Sheet.Title>
			<Sheet.Description class="font-reading text-text-muted">{title}</Sheet.Description>
		</Sheet.Header>
		<nav class="overflow-y-auto px-6 pb-6" aria-label="Chapters">
			<ol class="m-0 list-none p-0">{@render items(toc, 0)}</ol>
		</nav>
	</Sheet.Content>
</Sheet.Root>

<style>
	.toc-item {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		width: 100%;
		min-height: 2.75rem;
		padding-block: 0.55rem;
		padding-inline-end: 0.6rem;
		border: 0;
		border-radius: var(--r-radius-sm);
		background: transparent;
		font: inherit;
		font-family: var(--r-font-reading);
		color: var(--r-ink);
		text-align: start;
		cursor: pointer;
	}
	.toc-item:hover {
		background: color-mix(in oklab, var(--r-bg), var(--r-ink) 5%);
	}
	.toc-item[aria-current] {
		background: var(--r-accent-surface);
		color: var(--r-accent);
		font-weight: var(--r-weight-title);
	}
	.here {
		font-family: var(--r-font-ui);
		font-size: var(--r-text-xs);
		white-space: nowrap;
	}
</style>
