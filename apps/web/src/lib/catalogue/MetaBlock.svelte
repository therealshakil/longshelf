<!-- Rationale, sources and calm-ds Check results for one catalogue entry. -->
<script lang="ts">
	import { PRINCIPLE_NAMES, isAssumption, type CatalogueMeta } from '@ribbon/shared/design/meta';

	let { meta }: { meta: CatalogueMeta } = $props();

	const RESULT_LABEL = { pass: 'Pass', 'n/a': 'Not applicable', deferred: 'Deferred' } as const;
</script>

<section aria-labelledby="why" class="flex flex-col gap-3">
	<h2 id="why" class="text-lg">Why it looks like this</h2>
	<p>{meta.rationale}</p>
</section>

<section aria-labelledby="sources" class="flex flex-col gap-3">
	<h2 id="sources" class="text-lg">Sources</h2>
	<ol class="flex flex-col gap-2 pl-6">
		{#each meta.sources as source, i (i)}
			<li>
				{#if isAssumption(source)}
					<span class="font-strong">ASSUMPTION:</span> {source.note}
				{:else}
					{#if source.url}
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external source -->
						<a href={source.url} rel="external noreferrer">{source.title}</a>
					{:else}
						{source.title}
					{/if}
					<span class="text-text-muted">
						{#if source.publisher}· {source.publisher}{/if} · checked {source.checked}
					</span>
				{/if}
			</li>
		{/each}
	</ol>
</section>

<section aria-labelledby="checks" class="flex flex-col gap-3">
	<h2 id="checks" class="text-lg">calm-ds Checks</h2>
	<div class="overflow-x-auto">
		<table class="w-full border-collapse text-left">
			<thead>
				<tr class="border-b border-control">
					<th scope="col" class="py-2 pr-4">Principle</th>
					<th scope="col" class="py-2 pr-4">Result</th>
					<th scope="col" class="py-2">Reason</th>
				</tr>
			</thead>
			<tbody>
				{#each meta.checks as check (check.principle)}
					<tr class="border-b border-border align-top">
						<th scope="row" class="py-2 pr-4 font-regular">
							{check.principle}. {PRINCIPLE_NAMES[check.principle]}
						</th>
						<td class="py-2 pr-4 font-strong">{RESULT_LABEL[check.result]}</td>
						<td class="py-2">{check.reason}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
