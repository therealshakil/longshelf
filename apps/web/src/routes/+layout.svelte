<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import AppHeader from '#lib/components/AppHeader.svelte';
	import { SYNCS_PLACES } from '#lib/library/index.ts';
	import { flush, flushNow, onSendResult } from '#lib/reader/outbox.ts';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	// The header says "Offline" as soon as the connection drops, not only at the next load.
	let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine);
	$effect(() => {
		const update = () => (online = navigator.onLine);
		addEventListener('online', update);
		addEventListener('offline', update);
		return () => {
			removeEventListener('online', update);
			removeEventListener('offline', update);
		};
	});
	// Reading places go to the mirror on start, when back online, and as the page is hidden
	// (spec 004 FR-010). A refused send means the sign-in ran out: places wait for it.
	let signIn = $state(false);
	$effect(() => {
		if (!SYNCS_PLACES) return;
		const off = onSendResult((r) => {
			if (r === 'sign-in') signIn = true;
			else if (r === 'sent' || r === 'nothing') signIn = false;
		});
		const send = () => void flush();
		const hide = () => {
			if (document.visibilityState === 'hidden') void flushNow({ keepalive: true });
		};
		send();
		addEventListener('online', send);
		document.addEventListener('visibilitychange', hide);
		return () => {
			off();
			removeEventListener('online', send);
			document.removeEventListener('visibilitychange', hide);
		};
	});

	const sync = $derived(
		!online
			? { ...data.sync, state: 'offline' as const, reason: undefined }
			: signIn
				? { ...data.sync, state: 'attention' as const, reason: 'sign-in' as const }
				: data.sync
	);

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
		<AppHeader {current} {sync} query={page.url.searchParams.get('q') ?? ''} />
		{@render children()}
	</div>
{:else}
	{@render children()}
{/if}
