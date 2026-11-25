<!--
	One line above the library while offline (spec 004 FR-005, approved mock
	design-mocks/offline-states.html section 2). Shown only with no connection, and only when
	something is downloaded, so it never says what can't be done without saying what can.
-->
<script lang="ts">
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import { onDevice } from '#lib/offline/on-device.svelte.ts';

	let online = $state(true);
	$effect(() => {
		const update = () => (online = navigator.onLine);
		update();
		addEventListener('online', update);
		addEventListener('offline', update);
		return () => {
			removeEventListener('online', update);
			removeEventListener('offline', update);
		};
	});
	const count = $derived(onDevice().size);
</script>

{#if !online}
	<p class="note" role="status">
		<WifiOff class="size-5" aria-hidden="true" />
		<span
			><b>Offline.</b>
			{#if count}Books marked <span aria-hidden="true">✓</span><span class="sr-only"
					>with a tick</span
				>
				are on this device and open now.{:else}Nothing is downloaded on this device yet, so books
				need a connection to open.{/if}</span
		>
	</p>
{/if}

<style>
	.note {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
		max-width: 40rem;
		margin: 0 0 1rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--r-border);
		border-radius: var(--r-radius-md);
		font-size: var(--r-text-sm);
	}
	.note :global(svg) {
		margin-top: 0.1rem;
		color: var(--r-accent);
		flex: none;
	}
	b {
		color: var(--r-ink);
	}
</style>
