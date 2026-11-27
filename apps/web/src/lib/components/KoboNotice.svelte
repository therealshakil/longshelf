<!--
	"Kobo is further on" as a compact pill in the reader's top bar (owner, 2026-11-18: nothing floats
	over the text). Go there jumps to the other device's place; Stay dismisses it for this visit.
	Any device, not only Kobo, and this device too when the book opened at a newer place from
	elsewhere (spec 004 FR-009). Each place is offered once.
-->
<script lang="ts">
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	let {
		device,
		chapter,
		percent,
		onGo,
		onStay
	}: {
		device: string;
		chapter: string;
		percent: number;
		onGo: () => void;
		onStay: () => void;
	} = $props();
</script>

<div class="notice" role="status">
	<RefreshCw class="size-4 shrink-0 text-accent" aria-hidden="true" />
	<span class="msg"
		><b>{device} is further on</b>
		<span class="detail">· {chapter}, {percent}%</span></span
	>
	<button type="button" class="go" onclick={onGo}>Go there</button>
	<button type="button" class="stay" onclick={onStay}>Stay</button>
</div>

<style>
	.notice {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.25rem 0.35rem 0.25rem 0.75rem;
		border: 1px solid var(--r-border);
		border-radius: var(--r-radius-pill);
		font-size: var(--r-text-xs);
		color: var(--r-text);
		white-space: nowrap;
	}
	b {
		color: var(--r-ink);
		font-weight: var(--r-weight-strong);
	}
	.detail {
		color: var(--r-text-muted);
	}
	button {
		font: inherit;
		border: 0;
		cursor: pointer;
		min-height: 1.75rem;
		border-radius: var(--r-radius-pill);
	}
	.go {
		background: var(--r-action);
		color: var(--r-on-accent);
		font-weight: var(--r-weight-strong);
		padding: 0.3rem 0.8rem;
	}
	.go:hover {
		background: var(--r-accent);
	}
	.stay {
		background: transparent;
		color: var(--r-text-muted);
		font-weight: var(--r-weight-strong);
		padding: 0.3rem 0.5rem;
	}
	.stay:hover {
		color: var(--r-ink);
	}
	@media (max-width: 52rem) {
		.detail {
			display: none;
		}
	}
	@media (max-width: 40rem) {
		.notice {
			justify-content: space-between;
		}
		.msg {
			margin-right: auto;
		}
	}
</style>
