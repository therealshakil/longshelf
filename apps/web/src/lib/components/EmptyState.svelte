<!-- States what is empty and the one next step (calm-ds VI). -->
<script lang="ts">
	let { title, next }: { title: string; next?: { label: string; href: string } } = $props();
</script>

<div class="flex flex-col gap-2 py-6">
	<p class="text-text">{title}</p>
	{#if next}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- href is resolved by the caller -->
		<a href={next.href}>{next.label}</a>
	{/if}
</div>
