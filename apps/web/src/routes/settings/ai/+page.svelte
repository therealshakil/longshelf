<!--
	AI settings (operator view, constitution III): today's use against the daily ceiling, the
	on/off switch for every AI feature, and where your content goes. Plain words, no gauges.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Usage } from '@ribbon/shared/ai';
	import ErrorState from '#lib/components/ErrorState.svelte';
	import { resolve } from '$app/paths';

	let usage = $state<Usage | null>(null);
	let failed = $state(false);
	let saving = $state(false);

	async function load() {
		try {
			const r = await fetch('/api/ai/usage');
			if (!r.ok) throw new Error(String(r.status));
			usage = (await r.json()) as Usage;
		} catch {
			failed = true;
		}
	}

	async function toggle() {
		if (!usage) return;
		saving = true;
		await fetch('/api/ai/enabled', {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ enabled: !usage.enabled })
		});
		saving = false;
		await load();
	}

	onMount(load);
</script>

<svelte:head>
	<title>AI settings · Ribbon</title>
</svelte:head>

<main class="mx-auto flex max-w-[40rem] flex-col gap-6 py-8">
	<h1 class="text-2xl font-title">AI settings</h1>

	{#if failed}
		<ErrorState
			what="AI settings aren’t available here."
			lost="Nothing is lost. Ribbon works without AI; the AI parts stay hidden."
			next={{ label: 'Back to Home', href: resolve('/') }}
		/>
	{:else if usage}
		<section class="flex flex-col gap-3 border-b border-border pb-6" aria-labelledby="switch-h">
			<h2 id="switch-h" class="text-xl font-title">AI features</h2>
			<p>
				AI features are <b>{usage.enabled ? 'on' : 'off'}</b>. With them off, every screen still
				works: suggestions, recaps and genre suggestions are hidden, and search matches titles and
				authors only.
			</p>
			<button
				type="button"
				class="switch"
				onclick={toggle}
				disabled={saving}
				aria-pressed={usage.enabled}
			>
				{usage.enabled ? 'Switch AI off' : 'Switch AI on'}
			</button>
		</section>

		<section class="flex flex-col gap-2 border-b border-border pb-6" aria-labelledby="use-h">
			<h2 id="use-h" class="text-xl font-title">Today’s use</h2>
			<p>
				About {usage.today.neuronsEst.toLocaleString('en-GB')} of {usage.today.ceiling.toLocaleString(
					'en-GB'
				)}
				units today, across {usage.today.calls}
				{usage.today.calls === 1 ? 'request' : 'requests'}.
			</p>
			<p class="text-sm text-text-muted">
				Cloudflare includes 10,000 units a day free. Ribbon stops at the limit above and starts
				again the next day (UTC), so it costs nothing.
			</p>
		</section>

		<section class="flex flex-col gap-2" aria-labelledby="data-h">
			<h2 id="data-h" class="text-xl font-title">Where your books go</h2>
			<p>
				AI runs on Cloudflare Workers AI in your own Cloudflare account. Chapter text is used once
				to write a summary and isn’t kept; Cloudflare says it doesn’t train models on it. No other
				AI company receives your books.
			</p>
		</section>
	{:else}
		<p class="text-text-muted" role="status">Loading…</p>
	{/if}
</main>

<style>
	.switch {
		align-self: flex-start;
		min-height: var(--r-target);
		padding: 0 1.25rem;
		border: 1px solid var(--r-control);
		border-radius: var(--r-radius-pill);
		background: transparent;
		font: inherit;
		font-weight: var(--r-weight-strong);
		color: var(--r-ink);
		cursor: pointer;
	}
	.switch:hover {
		border-color: var(--r-ink);
	}
</style>
