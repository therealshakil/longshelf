<!--
	Story so far (spec 002 US4), per design-mocks/index.html#recap: a sheet from the right on
	wide screens and from the bottom on phones. A cut-off line says how far the recap goes; the
	recap is set in Literata; an AI note says how it was made. States: ready, writing, unavailable,
	too early.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import * as Sheet from '#lib/components/ui/sheet/index.ts';
	import { splitLead, type RecapView } from '#lib/ai/recap.ts';

	let {
		open = $bindable(false),
		title,
		author,
		place,
		awayDays,
		recap,
		continueHref,
		onContinue,
		onIncludeEarlier
	}: {
		open?: boolean;
		title: string;
		author?: string;
		/** The owner's furthest place: the recap's cut-off. */
		place: { label: string; percent: number };
		awayDays?: number;
		recap: RecapView;
		/** Where Continue reading goes; in the reader it just closes the sheet. */
		continueHref?: string;
		onContinue?: () => void;
		/** The owner chose to summarise the chapters before the recap's window (DR-0004). */
		onIncludeEarlier?: () => void;
	} = $props();

	let phone = $state(false);
	onMount(() => {
		const mq = matchMedia('(max-width: 40rem)');
		phone = mq.matches;
		const on = () => (phone = mq.matches);
		mq.addEventListener('change', on);
		return () => mq.removeEventListener('change', on);
	});

	const message = $derived(
		recap.state === 'loading' || recap.state === 'ready' ? null : splitLead(recap.reason)
	);
</script>

<Sheet.Root bind:open>
	<Sheet.Content
		side={phone ? 'bottom' : 'right'}
		class="sheet w-full gap-5 bg-bg sm:max-w-[34rem]"
	>
		<Sheet.Header class="p-0 pe-10">
			<Sheet.Title class="title-reading text-3xl leading-display text-ink">Story so far</Sheet.Title
			>
			<Sheet.Description class="font-reading text-text-muted"
				>{title}{#if author}&nbsp;· {author}{/if}</Sheet.Description
			>
		</Sheet.Header>

		{#if recap.state === 'too_early'}
			<p class="cut">You’re {place.percent}% into the book</p>
		{:else}
			<p class="cut">
				Up to <b>{place.label}</b> · {place.percent}%{#if awayDays && awayDays >= 1}&nbsp;· where
					you stopped {awayDays}
					{awayDays === 1 ? 'day' : 'days'} ago{/if}
			</p>
		{/if}

		{#if recap.state === 'ready'}
			{#if recap.coverage}
				<p class="covers">
					Covers {recap.coverage.fromLabel} to {recap.coverage.toLabel} in detail.
				</p>
			{/if}
			<div class="recap-text">
				{#each recap.paragraphs as p, i (i)}<p>{p}</p>{/each}
			</div>
			{#if recap.coverage?.limited}
				<p class="covers">
					Longshelf reached today’s limit for earlier chapters. Open Story so far tomorrow to add
					more.
				</p>
			{:else if recap.coverage && recap.earlier && onIncludeEarlier}
				<button type="button" class="earlier" onclick={onIncludeEarlier}>
					Include earlier chapters · about {recap.earlier.percent}% of today’s AI allowance{#if recap.earlier.days > 1},
						over {recap.earlier.days} days{/if}
				</button>
			{/if}
			<p class="ai-note">{recap.note}</p>
		{:else if recap.state === 'loading'}
			<div class="wait" role="status">
				<span class="line w-[90%]"></span><span class="line w-[75%]"></span><span
					class="line w-[85%]"
				></span><span class="line w-[60%]"></span>
				{#if recap.progress && recap.progress.done < recap.progress.total}
					<p>
						Reading the earlier chapters, {recap.progress.done} of {recap.progress.total}. The first
						recap of a long book can take a few minutes.
					</p>
				{:else}
					<p>Writing a recap up to {place.label}. This takes a few seconds.</p>
				{/if}
			</div>
		{:else if message}
			<div class="msg" role="status">
				<p><b>{message[0]}</b> {message[1]}</p>
			</div>
		{/if}

		<footer class="foot">
			{#if continueHref}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass a resolved path -->
				<a class="go" href={continueHref}>Continue reading <ArrowRight class="size-5" /></a>
			{:else}
				<button
					type="button"
					class="go"
					onclick={() => {
						open = false;
						onContinue?.();
					}}>Continue reading <ArrowRight class="size-5" /></button
				>
			{/if}
			<Sheet.Close class="later">Not now</Sheet.Close>
		</footer>
	</Sheet.Content>
</Sheet.Root>

<style>
	:global(.sheet) {
		padding: 1.75rem 2rem;
		overflow-y: auto;
		background-image: var(--r-grain);
	}
	@media (max-width: 40rem) {
		:global(.sheet) {
			max-height: 88vh;
			padding: 1.25rem 1.25rem 1.5rem;
			border-radius: var(--r-radius-md) var(--r-radius-md) 0 0;
		}
	}
	.cut {
		font-size: var(--r-text-sm);
		color: var(--r-text-muted);
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--r-border);
		font-variant-numeric: tabular-nums;
	}
	.cut b {
		color: var(--r-accent);
	}
	.recap-text {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-lg);
		line-height: var(--r-leading-reading);
		color: var(--r-text);
		font-variant-numeric: oldstyle-nums;
	}
	.recap-text p + p {
		margin-top: 0.9em;
	}
	.covers {
		font-size: var(--r-text-sm);
		color: var(--r-text-muted);
	}
	.earlier {
		align-self: flex-start;
		min-height: var(--r-target);
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--r-accent);
		font: inherit;
		font-size: var(--r-text-sm);
		font-weight: var(--r-weight-strong);
		text-align: start;
		text-decoration: underline;
		text-underline-offset: 0.2em;
		cursor: pointer;
	}
	.ai-note {
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
		border-top: 1px solid var(--r-border);
		padding-top: 1rem;
	}
	.wait {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
	.wait p {
		color: var(--r-text-muted);
		margin-top: 0.5rem;
	}
	.line {
		display: block;
		height: 0.8rem;
		border-radius: var(--r-radius-sm);
		background: var(--r-border);
	}
	.msg b {
		color: var(--r-ink);
	}
	/* Pinned to the bottom while a long recap scrolls (the mock's sticky footer). */
	.foot {
		position: sticky;
		bottom: -1.75rem;
		margin-top: auto;
		margin-bottom: -1.75rem;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding-top: 0.5rem;
		padding-bottom: 1.75rem;
		background: var(--r-bg) var(--r-grain);
	}
	@media (max-width: 40rem) {
		.foot {
			bottom: -1.5rem;
			margin-bottom: -1.5rem;
			padding-bottom: 1.5rem;
		}
	}
	.go {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: var(--r-target);
		padding: 0 1.5rem;
		border: 0;
		border-radius: var(--r-radius-pill);
		background: var(--r-action);
		color: var(--r-on-accent);
		font: inherit;
		font-weight: var(--r-weight-strong);
		text-decoration: none;
		cursor: pointer;
	}
	.foot :global(.later) {
		min-height: var(--r-target);
		border: 0;
		background: transparent;
		font: inherit;
		font-weight: var(--r-weight-strong);
		color: var(--r-text-muted);
		cursor: pointer;
	}
	.foot :global(.later:hover) {
		color: var(--r-ink);
	}
	@media (max-width: 40rem) {
		.go {
			flex: 1;
			justify-content: center;
		}
	}
</style>
