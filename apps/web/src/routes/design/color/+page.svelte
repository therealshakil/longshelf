<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import TokenTable from '#lib/catalogue/TokenTable.svelte';
	import {
		byGroup,
		contrast,
		cssVar,
		getToken,
		pairs,
		THEMES,
		type Theme
	} from '@ribbon/shared/tokens';
	import { meta } from './meta';

	const colours = byGroup('color');
	const value = (name: string, theme: Theme) =>
		(getToken(name).value as Record<Theme, string>)[theme];
	const ratio = (fg: string, bg: string, theme: Theme) =>
		contrast(value(fg, theme), value(bg, theme));
</script>

<EntryPage {meta}>
	<p>
		Both themes, side by side. Your system decides which one Ribbon uses; this page shows both so
		you can compare without switching.
	</p>

	<div class="grid gap-6 lg:grid-cols-2">
		{#each THEMES as theme (theme)}
			<section
				data-theme={theme}
				aria-label="{theme === 'light' ? 'Light' : 'Dark'} theme"
				class="flex flex-col gap-4 rounded-md border border-border bg-bg p-4 text-text"
			>
				<h2 class="text-lg">{theme === 'light' ? 'Light' : 'Dark'} theme</h2>

				<ul class="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
					{#each colours as c (c.name)}
						<li class="flex flex-col gap-1">
							<span
								class="block h-12 rounded-sm border border-control"
								style="background: var({cssVar(c.name)})"
							></span>
							<span class="text-sm font-strong">{c.name}</span>
							<code class="text-sm text-text-muted">{value(c.name, theme)}</code>
						</li>
					{/each}
				</ul>

				<p class="rounded-sm bg-surface p-3">
					Body text on <span class="font-strong">surface</span>. A
					<a href="#{theme}-sample">link in the accent colour</a>, and
					<span class="text-text-muted">secondary text for authors and dates</span>.
				</p>
				<p class="rounded-sm bg-accent-surface p-3" id="{theme}-sample">
					The current item, on the accent tint.
				</p>
				<p>
					<span
						class="inline-flex min-h-(--r-target) items-center rounded-sm bg-accent px-4 font-strong text-on-accent"
						>Primary action</span
					>
				</p>

				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-sm">
						<caption class="mb-2 text-left font-strong">Measured contrast</caption>
						<thead>
							<tr class="border-b border-control">
								<th scope="col" class="py-1 pr-3">Foreground on background</th>
								<th scope="col" class="py-1 pr-3">Ratio</th>
								<th scope="col" class="py-1 pr-3">Needs</th>
								<th scope="col" class="py-1">Result</th>
							</tr>
						</thead>
						<tbody>
							{#each pairs as p (p.fg + p.bg)}
								{@const r = ratio(p.fg, p.bg, theme)}
								<tr class="border-b border-border">
									<th scope="row" class="py-1 pr-3 font-regular">
										{p.fg} on {p.bg}
										<span class="text-text-muted">({p.use})</span>
									</th>
									<td class="py-1 pr-3">{r.toFixed(1)}:1</td>
									<td class="py-1 pr-3">{p.minRatio}:1</td>
									<td class="py-1 font-strong">{r >= p.minRatio ? 'Pass' : 'Fail'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/each}
	</div>

	<TokenTable tokens={colours} caption="Colour tokens" />
</EntryPage>
