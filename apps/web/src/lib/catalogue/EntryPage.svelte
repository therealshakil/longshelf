<!-- Shared frame for one catalogue page: title, the element's states, then rationale, sources, Checks. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { CatalogueMeta } from '@ribbon/shared/design/meta';
	import MetaBlock from './MetaBlock.svelte';

	let { meta, children }: { meta: CatalogueMeta; children: Snippet } = $props();
</script>

<svelte:head>
	<title>{meta.title} · Longshelf design</title>
</svelte:head>

<article class="flex flex-col gap-12">
	<header class="flex flex-col gap-2">
		<p class="text-sm text-text-muted">
			{meta.kind === 'token' ? 'Token' : meta.kind === 'component' ? 'Component' : 'Guide'}
		</p>
		<h1 class="text-2xl">{meta.title}</h1>
	</header>

	<section aria-label="Examples" class="flex flex-col gap-6">
		{@render children()}
	</section>

	<MetaBlock {meta} />
</article>
