<!--
	What happened, whether anything was lost, and the one next step. No blame, no idioms (FR-016).
-->
<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';

	let { what, lost, next }: { what: string; lost: string; next?: { label: string; href: string } } =
		$props();
</script>

<div class="flex gap-3 rounded-md border border-border bg-surface p-4" role="status">
	<CircleAlert class="mt-0.5 size-5 shrink-0 text-text-muted" aria-hidden="true" />
	<div class="flex flex-col gap-1">
		<p class="font-strong text-ink">{what}</p>
		<p class="text-sm text-text">{lost}</p>
		{#if next}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is resolved by the caller -->
			<a class="text-sm" href={next.href}>{next.label}</a>
		{/if}
	</div>
</div>
