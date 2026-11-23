<!-- Name, CSS variable, value and reason for a list of tokens. Optional preview column. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cssVar, type Token } from '@longshelf/shared/tokens';

	let {
		tokens,
		preview,
		caption
	}: { tokens: Token[]; preview?: Snippet<[Token]>; caption: string } = $props();

	const show = (v: Token['value']) =>
		typeof v === 'string' ? v : `light ${v.light} · dark ${v.dark}`;
</script>

<div class="overflow-x-auto">
	<table class="w-full border-collapse text-left">
		<caption class="sr-only">{caption}</caption>
		<thead>
			<tr class="border-b border-control">
				{#if preview}<th scope="col" class="py-2 pr-4">Example</th>{/if}
				<th scope="col" class="py-2 pr-4">Token</th>
				<th scope="col" class="py-2 pr-4">Value</th>
				<th scope="col" class="py-2">Why</th>
			</tr>
		</thead>
		<tbody>
			{#each tokens as token (token.name)}
				<tr class="border-b border-border align-top">
					{#if preview}<td class="py-3 pr-4">{@render preview(token)}</td>{/if}
					<th scope="row" class="py-3 pr-4 font-regular">
						<span class="font-strong">{token.name}</span><br />
						<code class="text-sm text-text-muted">{cssVar(token.name)}</code>
					</th>
					<td class="py-3 pr-4"><code class="text-sm">{show(token.value)}</code></td>
					<td class="py-3">{token.rationale}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
