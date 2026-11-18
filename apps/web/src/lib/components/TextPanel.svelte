<!--
	The reader's text settings, in a side sheet (Bits UI, so focus is trapped and returns on close).
	Settings apply at once and to every book on this device (FR-004).
-->
<script lang="ts">
	import * as Sheet from '#lib/components/ui/sheet/index.ts';
	import Segmented from './Segmented.svelte';
	import { SIZES, type ReaderSettings } from '#lib/reader/settings.ts';

	let {
		open = $bindable(false),
		settings = $bindable()
	}: { open?: boolean; settings: ReaderSettings } = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="panel w-full gap-0 bg-bg p-0 sm:max-w-[26rem]">
		<Sheet.Header class="px-6 pt-6 pb-2">
			<Sheet.Title class="font-reading text-2xl font-title text-ink">Text</Sheet.Title>
		</Sheet.Header>
		<div class="flex flex-col gap-5 overflow-y-auto px-6 pb-6">
			<div class="flex flex-col gap-2 border-b border-border pb-5">
				<label class="text-xs font-strong text-text" for="text-size">Size</label>
				<div class="flex items-center gap-3">
					<span class="font-reading text-sm" aria-hidden="true">A</span>
					<input
						id="text-size"
						class="flex-1"
						type="range"
						min="0"
						max={SIZES.length - 1}
						step="1"
						bind:value={settings.size}
						aria-valuetext="{Math.round(SIZES[settings.size] * 16)} pixels"
					/>
					<span class="font-reading text-xl" aria-hidden="true">A</span>
				</div>
			</div>
			<Segmented
				legend="Font"
				name="font"
				bind:value={settings.font}
				options={[
					{ value: 'literata', label: 'Literata', font: 'reading' },
					{ value: 'atkinson', label: 'Atkinson Hyperlegible' }
				]}
			/>
			<Segmented
				legend="Line spacing"
				name="spacing"
				bind:value={settings.spacing}
				options={[
					{ value: 'tight', label: 'Tight' },
					{ value: 'normal', label: 'Normal' },
					{ value: 'loose', label: 'Loose' }
				]}
			/>
			<Segmented
				legend="Margins"
				name="margins"
				bind:value={settings.margins}
				options={[
					{ value: 'narrow', label: 'Narrow' },
					{ value: 'medium', label: 'Medium' },
					{ value: 'wide', label: 'Wide' }
				]}
			/>
			<Segmented
				legend="Page"
				name="page"
				bind:value={settings.page}
				options={[
					{ value: 'scroll', label: 'Scroll' },
					{ value: 'pages', label: 'Turn pages' }
				]}
			/>
			<Segmented
				legend="Theme"
				name="theme"
				bind:value={settings.theme}
				options={[
					{ value: 'system', label: 'Match system' },
					{ value: 'paper', label: 'Paper' },
					{ value: 'night', label: 'Night' }
				]}
			/>
			<p class="border-t border-border pt-4 text-xs text-text-muted">
				Settings apply to every book on this device.
			</p>
		</div>
	</Sheet.Content>
</Sheet.Root>
