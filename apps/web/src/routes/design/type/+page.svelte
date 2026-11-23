<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import TokenTable from '#lib/catalogue/TokenTable.svelte';
	import { byGroup, cssVar } from '@longshelf/shared/tokens';
	import { meta } from './meta';

	const all = byGroup('type');
	const sizes = all.filter((t) => t.name.startsWith('text-'));
	const rest = all.filter((t) => !t.name.startsWith('text-'));
</script>

<EntryPage {meta}>
	<section aria-labelledby="scale" class="flex flex-col gap-4">
		<h2 id="scale" class="text-lg">Scale</h2>
		<ul class="flex list-none flex-col gap-4 p-0">
			{#each sizes as s (s.name)}
				<li class="flex flex-col gap-1 border-b border-border pb-4">
					<span class="text-sm text-text-muted">{s.name} · {s.value}</span>
					<span style="font-size: var({cssVar(s.name)})">The Left Hand of Darkness</span>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="faces" class="flex flex-col gap-4">
		<h2 id="faces" class="text-lg">Typefaces</h2>
		<div class="grid gap-6 md:grid-cols-2">
			<div class="flex flex-col gap-2 rounded-md bg-surface p-4">
				<p class="text-sm text-text-muted">Interface: Atkinson Hyperlegible Next</p>
				<p class="font-ui text-xl">Il1| O0o rn m · 6b 9q</p>
				<p class="font-ui">Download · Continue reading · Up to date</p>
			</div>
			<div class="flex flex-col gap-2 rounded-md bg-surface p-4">
				<p class="text-sm text-text-muted">Reading: Literata</p>
				<p class="font-reading text-xl">Il1| O0o rn m · 6b 9q</p>
				<p class="font-reading">Chapter Seven · The river at night</p>
			</div>
		</div>
	</section>

	<section aria-labelledby="measure" class="flex flex-col gap-4">
		<h2 id="measure" class="text-lg">Line length and spacing</h2>
		<p class="text-sm text-text-muted">
			A book description at the 66-character measure, 1.5 line height, in the reading face.
		</p>
		<div class="flex flex-col gap-4 rounded-md bg-surface p-4 font-reading">
			<p>
				A lighthouse keeper on a small northern island keeps a log of every ship that passes. When
				the ships stop coming, she keeps writing anyway: the weather, the birds, the colour of the
				sea in the morning. Over one long winter the log becomes something else, a record of how a
				person stays steady when nothing around her changes.
			</p>
			<p>
				This edition includes the keeper's original sketches and a short afterword about the
				island's history.
			</p>
		</div>
		<p class="text-sm text-text-muted">
			Emphasis example: this word is <em>important</em>. It is shown in a heavier weight, not
			italics.
		</p>
	</section>

	<TokenTable tokens={sizes} caption="Type size tokens" />
	<TokenTable tokens={rest} caption="Typeface, line height, weight and measure tokens" />
</EntryPage>
