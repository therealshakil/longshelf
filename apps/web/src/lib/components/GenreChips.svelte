<!--
	A book's genres (spec 002 US6). Calibre's are solid. Suggestions are outlined, with Promote and
	Remove, and stay in Ribbon until promoted. Promoting only queues the change for the next sync.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import X from '@lucide/svelte/icons/x';
	import type { GenreAction, GenreState } from '@ribbon/shared/ai';
	import { changeBookGenre, type BookGenre } from '#lib/ai/genres.ts';

	let {
		bookId,
		genres: initial,
		change = changeBookGenre
	}: {
		bookId: string;
		genres: BookGenre[];
		change?: (id: string, name: string, action: GenreAction) => Promise<GenreState | null>;
	} = $props();

	let genres = $derived(initial);
	let removed = $state<{ genre: BookGenre; before: BookGenre[] } | null>(null);
	let problem = $state('');
	let busy = $state(false);
	let list = $state<HTMLUListElement | null>(null);
	let undoButton = $state<HTMLButtonElement | null>(null);
	const anySuggested = $derived(genres.some((g) => g.state !== 'in_calibre'));

	async function promote(name: string) {
		if (busy) return;
		busy = true;
		problem = '';
		const state = await change(bookId, name, 'promote');
		busy = false;
		if (!state) {
			problem = `Couldn’t promote ${name}. Check your connection and try again.`;
			return;
		}
		genres = genres.map((g) => (g.name === name ? { ...g, state } : g));
		await tick();
		list?.querySelector<HTMLElement>(`[data-remove="${CSS.escape(name)}"]`)?.focus();
	}

	async function remove(genre: BookGenre) {
		if (busy) return;
		busy = true;
		problem = '';
		const before = genres;
		const state = await change(bookId, genre.name, 'remove');
		busy = false;
		if (!state) {
			problem = `Couldn’t remove ${genre.name}. Check your connection and try again.`;
			return;
		}
		genres = genres.filter((g) => g.name !== genre.name);
		removed = { genre, before };
		await tick();
		undoButton?.focus();
	}

	async function undo() {
		if (!removed || busy) return;
		const { genre, before } = removed;
		busy = true;
		problem = '';
		let state = await change(bookId, genre.name, 'restore');
		// A promoted genre goes back to waiting for sync, as it was.
		if (state && genre.state === 'promoted') state = await change(bookId, genre.name, 'promote');
		busy = false;
		if (!state) {
			problem = 'Couldn’t undo that. Check your connection and try again.';
			return;
		}
		genres = before;
		removed = null;
	}
</script>

{#if genres.length}
	<ul class="chips" bind:this={list}>
		{#each genres as genre (genre.name)}
			<li class="chip" class:suggested={genre.state !== 'in_calibre'}>
				<span>{genre.name}</span>
				{#if genre.state !== 'in_calibre'}
					<span class="acts">
						{#if genre.state === 'suggested'}
							<button
								type="button"
								class="promote"
								aria-label="Promote {genre.name}"
								onclick={() => promote(genre.name)}>Promote</button
							>
						{:else}
							<span class="waiting">Waiting for sync</span>
						{/if}
						<button
							type="button"
							class="remove"
							data-remove={genre.name}
							aria-label="Remove {genre.name}"
							onclick={() => remove(genre)}
						>
							<X class="size-3.5" aria-hidden="true" />
						</button>
					</span>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
<p class="notice" role="status">
	{#if problem}
		<span>{problem}</span>
	{:else if removed}
		<span>{removed.genre.name} removed.</span>
	{/if}
	{#if removed}
		<button bind:this={undoButton} type="button" onclick={undo}>Undo</button>
	{/if}
</p>
{#if anySuggested}
	<p class="note">
		Outlined genres are suggested by AI and stay in Longshelf until you promote them to Calibre.
	</p>
{/if}

<style>
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		max-inline-size: 100%;
		min-height: 2rem;
		padding: 0.25rem 0.8rem;
		border: 1px solid transparent;
		border-radius: 1rem;
		font-size: var(--r-text-sm);
		color: var(--r-ink);
		background: color-mix(in oklab, var(--r-bg), var(--r-ink) 7%);
	}
	.suggested {
		padding-right: 0.3rem;
		border: 1px dashed var(--r-text-muted);
		background: transparent;
	}
	.acts {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
	}
	.promote,
	.remove {
		display: inline-grid;
		place-items: center;
		min-width: 1.5rem;
		min-height: 1.5rem;
		border-radius: 0.75rem;
		color: var(--r-accent);
		cursor: pointer;
	}
	.promote {
		padding: 0 0.4rem;
		font-size: var(--r-text-xs);
		font-weight: var(--r-weight-strong);
	}
	.promote:hover,
	.remove:hover {
		background: var(--r-accent-surface);
	}
	.waiting {
		padding: 0 0.25rem;
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
	}
	.notice {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.75rem;
		margin-top: 0.6rem;
		font-size: var(--r-text-sm);
		color: var(--r-text);
	}
	.notice:empty {
		display: none;
	}
	.notice button {
		min-height: 1.5rem;
		font-weight: var(--r-weight-strong);
		color: var(--r-accent);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
		cursor: pointer;
	}
	.note {
		margin-top: 0.6rem;
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
	}
</style>
