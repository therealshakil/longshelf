<!--
	A small set of choices shown side by side (a radio group). Used for reader settings. The chosen
	option is filled; it's a real radio group, so arrow keys move between options.
-->
<script lang="ts" generics="T extends string">
	let {
		legend,
		name,
		options,
		value = $bindable()
	}: {
		legend: string;
		name: string;
		options: { value: T; label: string; font?: 'reading' | 'ui' }[];
		value: T;
	} = $props();
</script>

<fieldset class="flex flex-col gap-2 border-0 p-0">
	<legend class="mb-2 text-xs font-strong text-text">{legend}</legend>
	<div class="seg">
		{#each options as o (o.value)}
			<label class:reading={o.font === 'reading'}>
				<input class="sr-only" type="radio" {name} value={o.value} bind:group={value} />
				<span>{o.label}</span>
			</label>
		{/each}
	</div>
</fieldset>

<style>
	.seg {
		display: inline-flex;
		flex-wrap: wrap;
		align-self: flex-start;
		gap: 0.15rem;
		padding: 0.2rem;
		border: 1px solid var(--r-control);
		border-radius: var(--r-radius-pill);
	}
	label span {
		display: inline-flex;
		align-items: center;
		min-height: 2.25rem;
		padding: 0.35rem 0.9rem;
		border-radius: var(--r-radius-pill);
		font-size: var(--r-text-sm);
		color: var(--r-text-muted);
		cursor: pointer;
	}
	label.reading span {
		font-family: var(--r-font-reading);
	}
	input:checked + span {
		background: var(--r-action);
		color: var(--r-on-accent);
		font-weight: var(--r-weight-strong);
	}
	input:focus-visible + span {
		outline: var(--r-focus-width) solid var(--r-focus);
		outline-offset: var(--r-focus-offset);
	}
</style>
