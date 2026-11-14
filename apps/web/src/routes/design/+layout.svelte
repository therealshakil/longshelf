<!--
	Design catalogue frame. The index is always in the same place (calm-ds II): a sidebar on wide
	screens, a collapsed list at the top on narrow ones. The current page is marked by weight, a bar
	and aria-current, not by colour alone.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { RouteId } from '$app/types';
	import { entries, GROUPS, LAST_PAGE_KEY } from '#lib/catalogue/entries.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const href = (id: string) => resolve(`/design/${id}` as RouteId);
	const current = $derived(page.url.pathname.replace(/\/$/, ''));
	const currentTitle = $derived(entries.find((e) => href(e.id) === current)?.title);

	// Remember the last page so a return visit lands in the same place (calm-ds IV, US1 scenario 3).
	$effect(() => {
		if (current === '/design') return;
		try {
			localStorage.setItem(LAST_PAGE_KEY, current);
		} catch {
			// Storage unavailable: nothing to remember, nothing to report.
		}
	});
</script>

{#snippet index()}
	{#each GROUPS as group (group.kind)}
		{@const items = entries.filter((e) => e.kind === group.kind)}
		{#if items.length}
			<h2 class="text-sm font-strong text-text-muted">{group.label}</h2>
			<ul class="mb-6 flex list-none flex-col p-0">
				{#each items as entry (entry.id)}
					{@const isCurrent = href(entry.id) === current}
					<li>
						<a
							href={href(entry.id)}
							aria-current={isCurrent ? 'page' : undefined}
							class="flex min-h-(--r-target) items-center rounded-sm border-l-4 px-3 text-text no-underline"
							class:border-transparent={!isCurrent}
							class:border-accent={isCurrent}
							class:bg-accent-surface={isCurrent}
							class:font-strong={isCurrent}
						>
							{entry.title}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{/each}
{/snippet}

<div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:flex-row md:px-8">
	<nav aria-label="Design catalogue" class="md:w-64 md:shrink-0">
		<p class="mb-6">
			<a href={resolve('/')} class="text-text-muted">Ribbon</a>
			<span class="text-text-muted"> / </span>
			<span class="font-strong">Design</span>
		</p>
		<div class="hidden md:block">{@render index()}</div>
		<details class="rounded-md border border-border bg-surface md:hidden">
			<summary class="flex min-h-(--r-target) cursor-pointer items-center px-4 font-strong">
				All design pages{#if currentTitle}<span class="font-regular text-text-muted"
						>&nbsp;· now: {currentTitle}</span
					>{/if}
			</summary>
			<div class="px-4 pt-2">{@render index()}</div>
		</details>
	</nav>

	<main class="min-w-0 flex-1">
		{@render children()}
	</main>
</div>
