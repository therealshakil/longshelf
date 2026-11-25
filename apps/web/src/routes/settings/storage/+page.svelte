<!--
	Storage (spec 004 US3, FR-014, FR-015): the books downloaded to this device, their sizes, the
	space left, whether the device keeps them, and this device's name. Matches the approved mock
	design-mocks/storage.html. Removing a book never touches its reading place.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Shield from '@lucide/svelte/icons/shield';
	import {
		downloads,
		keepDownloads,
		list,
		remove,
		removeAll,
		storageInfo,
		type DownloadEntry,
		type StorageInfo
	} from '#lib/offline/downloads.ts';
	import { renameDevice, thisDevice } from '#lib/offline/device.ts';
	import { library } from '#lib/library/index.ts';
	import { fileSize } from '#lib/library/format.ts';

	let entries = $state<DownloadEntry[]>([]);
	let info = $state<StorageInfo | null>(null);
	/** Books the library still lists, with their authors and covers. */
	let known = $state<Record<string, { author?: string; cover?: string }>>({});
	let confirming = $state(false);
	let device = $state({ id: '', name: '' });
	let renaming = $state(false);
	let newName = $state('');

	async function refresh() {
		[entries, info] = await Promise.all([list(), storageInfo()]);
		const pages = await Promise.all(entries.map((e) => library.book(e.bookId).catch(() => null)));
		known = Object.fromEntries(
			pages.flatMap((p) =>
				p ? [[p.book.id, { author: p.book.authors[0]?.name, cover: p.book.cover?.url }]] : []
			)
		);
	}

	onMount(() => {
		device = thisDevice();
		void refresh();
		downloads.addEventListener('change', refresh);
		return () => downloads.removeEventListener('change', refresh);
	});

	async function keep() {
		await keepDownloads();
		info = await storageInfo();
	}

	function saveName(e: SubmitEvent) {
		e.preventDefault();
		device = renameDevice(newName);
		renaming = false;
	}
</script>

<svelte:head>
	<title>Storage · Longshelf</title>
</svelte:head>

<main class="st" aria-labelledby="st-h">
	<div>
		<h1 id="st-h">Storage</h1>
		<p class="lead">Books you have downloaded to this device. They open with no connection.</p>
	</div>

	<section aria-labelledby="sp-h">
		<h2 id="sp-h">On this device</h2>
		{#if info}
			<dl class="sum">
				<dt>Downloaded</dt>
				<dd>
					{info.count}
					{info.count === 1 ? 'book' : 'books'}{info.count ? ` · ${fileSize(info.used)}` : ''}
				</dd>
				{#if info.available != null}
					<dt>Space left</dt>
					<dd>About {fileSize(info.available)}</dd>
				{/if}
			</dl>
			{#if info.persisted}
				<div class="kept">
					<ShieldCheck class="size-5" aria-hidden="true" />
					<p>This device has agreed to keep your downloads. It won’t clear them to make space.</p>
				</div>
			{:else}
				<div class="kept">
					<Shield class="size-5" aria-hidden="true" />
					<div>
						<p>
							This device may clear your downloads if it runs low on space. Your reading places are
							safe either way.
						</p>
						<button type="button" class="pill" onclick={keep}>Ask to keep downloads</button>
					</div>
				</div>
			{/if}
		{/if}
	</section>

	<section aria-labelledby="bk-h">
		<h2 id="bk-h">Downloaded books</h2>
		{#if entries.length}
			<ul class="dl">
				{#each entries as e (e.fileUrl)}
					{@const k = known[e.bookId]}
					<li>
						{#if k?.cover}<img src={k.cover} alt="" loading="lazy" />{:else}<span
								class="blank"
								aria-hidden="true"
							></span>{/if}
						<div>
							<p class="t">
								<a href={resolve('/read/[id]', { id: e.bookId })}>{e.title}</a>
							</p>
							<p class="m">
								{[k?.author, e.format, fileSize(e.size)].filter(Boolean).join(' · ')}
							</p>
							{#if !k}<p class="gone">No longer in your library. This copy still opens.</p>{/if}
						</div>
						<button
							type="button"
							class="pill"
							aria-label="Remove {e.title} from this device"
							onclick={() => remove(e.fileUrl)}>Remove</button
						>
					</li>
				{/each}
			</ul>
			{#if confirming}
				<div class="confirm" role="alertdialog" aria-labelledby="cf-h">
					<p id="cf-h">
						<b
							>Remove all {entries.length}
							{entries.length === 1 ? 'book' : 'books'} from this device?</b
						>
						They stay in your library, and your places are kept. You can download them again when online.
					</p>
					<div class="row">
						<button
							type="button"
							class="pill"
							onclick={async () => {
								confirming = false;
								await removeAll();
							}}>Remove all</button
						>
						<button type="button" class="link" onclick={() => (confirming = false)}
							>Keep them</button
						>
					</div>
				</div>
			{:else}
				<div class="row">
					<button type="button" class="pill" onclick={() => (confirming = true)}
						>Remove all downloads</button
					>
					<span class="note">Reading places are kept.</span>
				</div>
			{/if}
		{:else if info}
			<p class="lead">Nothing downloaded yet. Use Download on a book’s page to keep it here.</p>
		{/if}
	</section>

	<section aria-labelledby="dv-h">
		<h2 id="dv-h">This device</h2>
		{#if renaming}
			<form class="row" onsubmit={saveName}>
				<label class="sr-only" for="dev-name">Device name</label>
				<input id="dev-name" bind:value={newName} maxlength="60" autocomplete="off" />
				<button type="submit" class="pill">Save</button>
				<button type="button" class="link" onclick={() => (renaming = false)}>Cancel</button>
			</form>
		{:else}
			<div class="row">
				<b class="name">{device.name}</b>
				<button
					type="button"
					class="pill"
					onclick={() => {
						newName = device.name;
						renaming = true;
					}}>Rename</button
				>
			</div>
		{/if}
		<p class="lead">
			Your other devices show this name when they offer to take you to where you stopped here.
		</p>
	</section>
</main>

<style>
	.st {
		max-width: 40rem;
		margin: 0 auto;
		padding: 2rem 0 4rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	h1 {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-2xl, 1.75rem);
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
	}
	h2 {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-xl, 1.25rem);
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
		margin-bottom: 0.75rem;
	}
	.lead {
		color: var(--r-text-muted);
		margin-top: 0.4rem;
	}
	section {
		border-bottom: 1px solid var(--r-border);
		padding-bottom: 2rem;
	}
	section:last-of-type {
		border-bottom: 0;
	}
	.sum {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.45rem 1.5rem;
	}
	.sum dt {
		color: var(--r-text-muted);
	}
	.sum dd {
		margin: 0;
		color: var(--r-ink);
		font-variant-numeric: tabular-nums;
	}
	.kept {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
		margin-top: 1rem;
		padding: 0.85rem 1rem;
		border: 1px solid var(--r-border);
		border-radius: var(--r-radius-md);
	}
	.kept :global(svg) {
		margin-top: 0.1rem;
		color: var(--r-accent);
		flex: none;
	}
	.kept .pill {
		margin-top: 0.6rem;
	}
	.dl {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.dl li {
		display: grid;
		grid-template-columns: 2.75rem 1fr auto;
		gap: 0.9rem;
		align-items: center;
		padding: 0.8rem 0;
		border-top: 1px solid var(--r-border);
	}
	.dl li:last-child {
		border-bottom: 1px solid var(--r-border);
	}
	.dl img,
	.blank {
		display: block;
		width: 2.75rem;
		aspect-ratio: 2 / 3;
		object-fit: cover;
		border-radius: var(--r-radius-cover);
		background: var(--r-surface);
	}
	.t {
		font-family: var(--r-font-reading);
		font-weight: var(--r-weight-title);
		font-size: 1.0625rem;
		line-height: 1.25;
		color: var(--r-ink);
	}
	.t a {
		color: inherit;
		text-decoration: none;
	}
	.t a:hover {
		text-decoration: underline;
	}
	.m,
	.note {
		font-size: var(--r-text-sm);
		color: var(--r-text-muted);
	}
	.gone {
		font-size: var(--r-text-sm);
		color: var(--r-accent);
	}
	.pill {
		min-height: var(--r-target);
		padding: 0 1rem;
		border: 1px solid var(--r-control);
		border-radius: var(--r-radius-pill);
		background: transparent;
		font: inherit;
		color: var(--r-ink);
		cursor: pointer;
	}
	.pill:hover {
		border-color: var(--r-ink);
	}
	.link {
		border: 0;
		background: none;
		font: inherit;
		color: var(--r-ink);
		text-decoration: underline;
		text-underline-offset: 0.15em;
		cursor: pointer;
		min-height: var(--r-target);
	}
	.row {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
		margin-top: 1rem;
	}
	.confirm {
		margin-top: 1rem;
		padding: 1rem;
		border: 1px solid var(--r-control);
		border-radius: var(--r-radius-md);
	}
	.name {
		font-family: var(--r-font-reading);
		font-size: 1.125rem;
		color: var(--r-ink);
	}
	input {
		min-height: var(--r-target);
		padding: 0 0.9rem;
		border: 1px solid var(--r-control);
		border-radius: var(--r-radius-md);
		background: transparent;
		font: inherit;
		color: var(--r-ink);
	}
</style>
