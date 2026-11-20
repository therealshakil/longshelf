<!--
	A vertical A–Z rail for long lists (approved in live review): press and drag along it to jump
	through the letters; a large letter shows where you are. Letters with no entries are dimmed and
	skipped. Each letter is also an ordinary link for keyboard and single taps.
-->
<script lang="ts">
	import { LETTERS, letterAt } from '#lib/library/letter-rail.ts';

	let { present, idPrefix }: { present: Set<string>; idPrefix: string } = $props();

	let rail: HTMLElement | undefined = $state();
	let scrubbing = $state(false);
	let shown = $state<string | null>(null);

	function jump(letter: string) {
		if (!present.has(letter)) return;
		document.getElementById(`${idPrefix}${letter}`)?.scrollIntoView({ block: 'start' });
	}

	function pick(e: PointerEvent) {
		if (!rail) return;
		const r = rail.getBoundingClientRect();
		const l = letterAt(e.clientY, r.top, r.height);
		shown = l;
		jump(l);
	}
</script>

<nav
	class="rail"
	class:scrubbing
	aria-label="Jump to letter"
	bind:this={rail}
	onpointerdown={(e) => {
		e.preventDefault();
		rail?.setPointerCapture(e.pointerId);
		scrubbing = true;
		pick(e);
	}}
	onpointermove={(e) => scrubbing && pick(e)}
	onpointerup={() => ((scrubbing = false), (shown = null))}
	onpointercancel={() => ((scrubbing = false), (shown = null))}
>
	{#each LETTERS as l (l)}
		{#if present.has(l)}
			<a href="#{idPrefix}{l}" onclick={(e) => (e.preventDefault(), jump(l))}>{l}</a>
		{:else}
			<span aria-hidden="true">{l}</span>
		{/if}
	{/each}
</nav>
{#if shown}<div class="bubble" aria-hidden="true">{shown}</div>{/if}

<style>
	.rail {
		position: fixed;
		right: max(0.5rem, calc((100vw - 90rem) / 2 + 0.5rem));
		top: 50%;
		transform: translateY(-50%);
		z-index: 20;
		display: flex;
		flex-direction: column;
		padding: 0.4rem 0.2rem;
		border-radius: var(--r-radius-md);
		background: color-mix(in oklab, var(--r-bg) 85%, transparent);
		touch-action: none;
		user-select: none;
		cursor: ns-resize;
	}
	.rail.scrubbing {
		background: color-mix(in oklab, var(--r-bg), var(--r-ink) 6%);
	}
	a,
	span {
		display: grid;
		place-items: center;
		min-width: 1.75rem;
		height: 1.5rem; /* minimum target size (WCAG 2.5.8) */
		font-size: var(--r-text-xs);
		font-weight: var(--r-weight-strong);
		border-radius: var(--r-radius-sm);
		text-decoration: none;
	}
	a {
		color: var(--r-accent);
	}
	span {
		color: var(--r-control);
	}
	/* Short screens: keep only letters with entries so the rail still fits. */
	@media (max-height: 44rem) {
		span {
			display: none;
		}
	}
	.bubble {
		position: fixed;
		top: 50%;
		right: 4.5rem;
		transform: translateY(-50%);
		z-index: 21;
		display: grid;
		place-items: center;
		width: 4.5rem;
		height: 4.5rem;
		border-radius: var(--r-radius-pill);
		background: var(--r-accent);
		color: var(--r-on-accent);
		font-family: var(--r-font-reading);
		font-size: var(--r-text-2xl);
		font-weight: var(--r-weight-title);
		pointer-events: none;
	}
</style>
