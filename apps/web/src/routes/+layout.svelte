<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import AppHeader from '#lib/components/AppHeader.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const path = $derived(page.url.pathname);
	// The reader and the design catalogue have their own frames.
	const framed = $derived(!path.startsWith('/read/') && !path.startsWith('/design'));
	const current = $derived(
		path === '/'
			? 'home'
			: path.startsWith('/library') || path.startsWith('/book')
				? 'library'
				: null
	);
</script>

{#if framed}
	<div class="mx-auto max-w-[90rem] px-[clamp(1rem,4vw,3.5rem)]">
		<AppHeader {current} sync={data.sync} query={page.url.searchParams.get('q') ?? ''} />
		{@render children()}
	</div>
{:else}
	{@render children()}
{/if}
