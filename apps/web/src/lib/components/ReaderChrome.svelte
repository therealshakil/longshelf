<!--
	The reader's two thin bars. Top: back, title and chapter, a slot for the device notice,
	Contents, text settings, bookmark. Bottom: a full-width progress line with a tick for the other
	device, the percentage, minutes left in the chapter, and Story so far.
	A tap in the middle of the page hides both (handled by the route); they slide only when the
	system allows motion.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ListIcon from '@lucide/svelte/icons/list';
	import ALargeSmall from '@lucide/svelte/icons/a-large-small';
	import Bookmark from '@lucide/svelte/icons/bookmark';

	let {
		title,
		chapter,
		percent,
		other,
		minutesLeft,
		hidden = false,
		topHeight = $bindable(0),
		bookmarked = false,
		backHref,
		notice,
		onContents,
		onText,
		onBookmark,
		onStorySoFar
	}: {
		title: string;
		chapter?: string;
		percent: number;
		other?: { device: string; percent: number };
		minutesLeft?: number;
		hidden?: boolean;
		/** Height of the top bar, so the page starts below it (it grows when a notice shows). */
		topHeight?: number;
		bookmarked?: boolean;
		backHref: string;
		notice?: Snippet;
		onContents: () => void;
		onText: () => void;
		onBookmark: () => void;
		onStorySoFar?: () => void;
	} = $props();
</script>

<header class="top reveal" class:off={hidden} inert={hidden} bind:clientHeight={topHeight}>
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- backHref is resolved by the route -->
	<a class="btn" href={backHref} aria-label="Back to the book"
		><ChevronLeft class="size-5" aria-hidden="true" /></a
	>
	<div class="title">
		<b>{title}</b>
		{#if chapter}<span>{chapter}</span>{/if}
	</div>
	{#if notice}<div class="notice">{@render notice()}</div>{/if}
	<nav class="tools" aria-label="Reader">
		<button type="button" class="btn" aria-label="Contents" onclick={onContents}
			><ListIcon class="size-5" aria-hidden="true" /></button
		>
		<button type="button" class="btn" aria-label="Text settings" onclick={onText}
			><ALargeSmall class="size-5" aria-hidden="true" /></button
		>
		<button
			type="button"
			class="btn"
			aria-label="Bookmark this page"
			aria-pressed={bookmarked}
			onclick={onBookmark}
			><Bookmark
				class="size-5"
				fill={bookmarked ? 'currentColor' : 'none'}
				aria-hidden="true"
			/></button
		>
	</nav>
</header>

<footer class="bottom reveal" class:off={hidden} inert={hidden}>
	<div
		class="track"
		role="img"
		aria-label="{percent}% through the book{other ? `; ${other.device} at ${other.percent}%` : ''}"
	>
		<i style:width="{percent}%"></i>
		{#if other}<s style:left="{other.percent}%" title="{other.device} {other.percent}%"></s>{/if}
	</div>
	<div class="foot">
		<b>{percent}%</b>
		{#if minutesLeft !== undefined}<span
				>{minutesLeft < 1 ? 'Less than a minute' : `${minutesLeft} min`} left in chapter</span
			>{/if}
		{#if onStorySoFar}<button type="button" class="recap" onclick={onStorySoFar}
				>Story so far</button
			>{:else}<span></span>{/if}
	</div>
</footer>

<style>
	.top,
	.bottom {
		position: fixed;
		inset-inline: 0;
		z-index: 30;
		background: color-mix(in oklab, var(--r-bg) 94%, transparent);
		padding-inline: clamp(0.75rem, 3vw, 2rem);
	}
	.top {
		top: 0;
		display: grid;
		grid-template-columns: auto 1fr auto auto;
		align-items: center;
		gap: 1rem;
		padding-block: 0.6rem;
		border-bottom: 1px solid var(--r-border);
	}
	.bottom {
		bottom: 0;
		padding-block: 0.6rem max(0.75rem, env(safe-area-inset-bottom));
		border-top: 1px solid var(--r-border);
	}
	.off.top {
		transform: translateY(-100%);
		opacity: 0;
	}
	.off.bottom {
		transform: translateY(100%);
		opacity: 0;
	}
	.title {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
		line-height: var(--r-leading-tight);
	}
	.title b {
		font-family: var(--r-font-reading);
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
	}
	.title span {
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
	}
	.tools {
		display: flex;
		gap: 0.25rem;
	}
	.btn {
		display: grid;
		place-items: center;
		width: var(--r-target);
		height: var(--r-target);
		border: 0;
		border-radius: var(--r-radius-pill);
		background: transparent;
		color: var(--r-ink);
		cursor: pointer;
	}
	.btn:hover {
		background: color-mix(in oklab, var(--r-bg), var(--r-ink) 6%);
	}
	.btn[aria-pressed='true'] {
		color: var(--r-accent);
	}
	.track {
		position: relative;
		height: 0.1875rem;
		margin: 0.35rem 0 0.6rem;
		background: var(--r-border);
	}
	.track i {
		position: absolute;
		inset: 0 auto 0 0;
		background: var(--r-accent);
	}
	.track s {
		position: absolute;
		top: -0.25rem;
		width: 0.125rem;
		height: 0.6875rem;
		background: var(--r-text);
		text-decoration: none;
	}
	.foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
		font-variant-numeric: tabular-nums;
	}
	.foot b {
		color: var(--r-accent);
		font-size: var(--r-text-sm);
	}
	.recap {
		border: 0;
		background: transparent;
		font: inherit;
		font-weight: var(--r-weight-strong);
		color: var(--r-accent);
		text-decoration: underline;
		text-underline-offset: 0.2em;
		cursor: pointer;
		min-height: 1.5rem;
	}
	@media (max-width: 40rem) {
		.top {
			grid-template-columns: auto 1fr auto;
			row-gap: 0.4rem;
		}
		.title span {
			display: none;
		}
		.notice {
			grid-column: 1 / -1;
			grid-row: 2;
		}
	}
</style>
