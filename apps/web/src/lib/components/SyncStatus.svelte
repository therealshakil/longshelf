<!--
	Sync status: peripheral, icon plus text, never animated, and it sits in the header (FR-006).
	It never floats over content.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import CloudOff from '@lucide/svelte/icons/cloud-off';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import type { SyncState } from '@longshelf/shared/library';

	let { sync, now = new Date() }: { sync: SyncState; now?: Date } = $props();

	const minutes = $derived(
		sync.lastSync
			? Math.max(0, Math.round((now.getTime() - Date.parse(sync.lastSync)) / 60_000))
			: null
	);
	const label = $derived.by(() => {
		switch (sync.state) {
			case 'syncing':
				return 'Syncing';
			case 'offline':
				return 'Offline';
			case 'attention':
				return sync.reason === 'sign-in' ? 'Sign in again' : 'Sync needs attention';
			default:
				return minutes === null
					? 'Synced'
					: minutes < 1
						? 'Synced just now'
						: minutes < 60
							? `Synced ${minutes} min ago`
							: `Synced ${Math.round(minutes / 60)} h ago`;
		}
	});
</script>

<span class="sync flex items-center gap-1.5 text-sm text-text-muted" title="Last sync from Calibre">
	{#if sync.state === 'offline'}
		<CloudOff class="size-4 shrink-0" aria-hidden="true" />
	{:else if sync.state === 'attention'}
		<CircleAlert class="size-4 shrink-0" aria-hidden="true" />
	{:else}
		<RefreshCw class="size-4 shrink-0" aria-hidden="true" />
	{/if}
	{#if sync.reason === 'sign-in'}
		<!-- A full page load, so Cloudflare Access can show its sign-in page. -->
		<a class="sync-label" href={resolve('/')} data-sveltekit-reload>{label}</a>
	{:else}
		<span class="sync-label">{label}</span>
	{/if}
</span>

<style>
	@media (max-width: 40rem) {
		.sync-label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
		}
	}
</style>
