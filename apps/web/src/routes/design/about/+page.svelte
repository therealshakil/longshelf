<script lang="ts">
	import EntryPage from '#lib/catalogue/EntryPage.svelte';
	import { meta } from './meta';

	const REPO = 'the Longshelf repository';
</script>

<EntryPage {meta}>
	<div class="flex flex-col gap-4">
		<p>
			Each page covers one design element: a token group (such as colour or type) or a component
			(such as a book card). Every page has the same three parts, in the same order:
		</p>
		<ol class="flex flex-col gap-2 pl-6">
			<li><span class="font-strong">Examples</span>: every state of the element, side by side.</li>
			<li>
				<span class="font-strong">Why it looks like this</span>: the reason, in plain words.
			</li>
			<li>
				<span class="font-strong">Sources</span> and
				<span class="font-strong">calm-ds Checks</span>: where each decision comes from (or
				ASSUMPTION), and how the element does against each of the seven calm-ds principles.
			</li>
		</ol>
		<p>
			The research behind these pages is in <code>specs/001-visual-design/research.md</code>
			in {REPO}. Why the catalogue is built into the app rather than using Storybook is recorded in
			<code>docs/decisions/DR-0001-design-catalogue.md</code>.
		</p>
		<p>
			To see the other theme, switch your system between light and dark. The colour page shows both
			themes side by side.
		</p>
	</div>
</EntryPage>
