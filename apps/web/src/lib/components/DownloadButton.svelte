<!--
	Keep a book on this device (spec 004 US1). The states follow the approved mock
	design-mocks/offline-states.html section 1: Download, downloading with Cancel, On this device,
	Update, not enough space, offline, and stopped. Removing is in the book page's More menu.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import Check from '@lucide/svelte/icons/check';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import {
		DownloadError,
		download,
		downloads,
		entryFor,
		remove,
		status,
		update,
		type DownloadEntry,
		type DownloadStatus
	} from '#lib/offline/downloads.ts';
	import { fileSize } from '#lib/library/format.ts';

	let {
		book,
		file,
		downloaded = $bindable(false),
		preview
	}: {
		book: { id: string; title: string };
		/** The file the reader opens, or null when the book has none it can read. */
		file: { url: string; format: string; size?: number } | null;
		downloaded?: boolean;
		/** Design catalogue only: show one state without touching storage. */
		preview?: {
			state: DownloadStatus;
			online?: boolean;
			progress?: { received: number; total?: number };
			failure?: DownloadError;
			size?: number;
		};
	} = $props();

	let current = $state<DownloadStatus | 'loading'>('loading');
	let entry = $state<DownloadEntry | undefined>();
	let online = $state(true);
	let progress = $state<{ received: number; total?: number } | null>(null);
	let failure = $state<DownloadError | null>(null);
	let controller: AbortController | null = null;

	async function refresh() {
		current = await status(book.id, file?.url ?? null);
		entry = await entryFor(book.id);
		downloaded = current !== 'none';
	}

	onMount(() => {
		if (preview) {
			current = preview.state;
			online = preview.online ?? true;
			progress = preview.progress ?? null;
			failure = preview.failure ?? null;
			entry = preview.size
				? {
						bookId: book.id,
						title: book.title,
						format: 'EPUB',
						size: preview.size,
						savedAt: '',
						fileUrl: ''
					}
				: undefined;
			return;
		}
		online = navigator.onLine;
		const on = () => (online = navigator.onLine);
		void refresh();
		downloads.addEventListener('change', refresh);
		addEventListener('online', on);
		addEventListener('offline', on);
		return () => {
			downloads.removeEventListener('change', refresh);
			removeEventListener('online', on);
			removeEventListener('offline', on);
			controller?.abort();
		};
	});

	async function start() {
		if (!file) return;
		failure = null;
		controller = new AbortController();
		progress = { received: 0, total: file.size };
		try {
			const run = current === 'update' ? update : download;
			await run(
				{
					bookId: book.id,
					title: book.title,
					format: file.format,
					fileUrl: file.url,
					size: file.size
				},
				{
					signal: controller.signal,
					onProgress: (received, total) => (progress = { received, total })
				}
			);
		} catch (err) {
			const e = err instanceof DownloadError ? err : new DownloadError('failed');
			if (e.kind !== 'cancelled') failure = e;
		} finally {
			controller = null;
			progress = null;
			await refresh();
		}
	}

	/** For the More menu. */
	export async function removeDownload() {
		if (entry) await remove(entry.fileUrl);
	}

	const sizeLabel = (n?: number) => (n ? ` · ${fileSize(n)}` : '');
	const pct = $derived(
		progress?.total
			? Math.min(100, Math.round((progress.received / progress.total) * 100))
			: undefined
	);
</script>

{#if file && current !== 'loading'}
	<div class="dl">
		{#if progress}
			<div
				class="prog"
				role="progressbar"
				aria-label="Downloading {book.title}"
				aria-valuemin="0"
				aria-valuemax="100"
				aria-valuenow={pct}
			>
				<div class="row">
					<span
						>Downloading… {fileSize(progress.received)}{progress.total
							? ` of ${fileSize(progress.total)}`
							: ''}</span
					>
					<button type="button" class="link" onclick={() => controller?.abort()}>Cancel</button>
				</div>
				<div class="track"><i style:width="{pct ?? 30}%"></i></div>
			</div>
		{:else if current === 'downloaded'}
			<span class="out on"
				><Check class="size-4" aria-hidden="true" />On this device{sizeLabel(entry?.size)}</span
			>
			<p class="msg">Opens with no connection.</p>
		{:else if current === 'update'}
			<button type="button" class="out" onclick={start} disabled={!online} aria-disabled={!online}
				><RefreshCw class="size-4" aria-hidden="true" />Update{sizeLabel(file.size)}</button
			>
			<p class="msg">The book changed in Calibre. Your copy still opens until you update.</p>
		{:else if !online}
			<button type="button" class="out" aria-disabled="true" disabled
				><DownloadIcon class="size-4" aria-hidden="true" />Download when online</button
			>
		{:else}
			<button type="button" class="out" onclick={start}
				><DownloadIcon class="size-4" aria-hidden="true" />{failure?.kind === 'failed'
					? 'Try again'
					: 'Download'}{sizeLabel(file.size)}</button
			>
		{/if}
		{#if failure && !progress}
			<p class="msg" role="status">
				{#if failure.kind === 'no-space'}
					<b>Not enough space on this device.</b>
					It needs {fileSize(failure.needed ?? file.size ?? 0)}.
					<a href={resolve('/settings/storage')}>Free some space in Storage</a>
				{:else if failure.kind === 'offline'}
					You’re offline, so nothing was saved. Download it when you’re connected.
				{:else}
					The connection dropped, so nothing was saved.
				{/if}
			</p>
		{/if}
	</div>
{/if}

<style>
	.dl {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: min(100%, 15rem);
	}
	.out {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: 0.5rem;
		min-height: var(--r-target);
		padding: 0 1.1rem;
		border: 1px solid var(--r-control);
		border-radius: var(--r-radius-pill);
		background: transparent;
		font: inherit;
		font-weight: var(--r-weight-strong);
		color: var(--r-ink);
		cursor: pointer;
	}
	.out:hover:not(:disabled) {
		border-color: var(--r-ink);
	}
	.out:disabled {
		color: var(--r-text-muted);
		border-color: var(--r-border);
		cursor: default;
	}
	.out.on {
		cursor: default;
	}
	.msg {
		font-size: var(--r-text-sm);
		color: var(--r-text-muted);
		max-width: 22rem;
	}
	.msg b {
		color: var(--r-ink);
	}
	.msg a {
		color: var(--r-accent);
	}
	.prog {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: min(100%, 15rem);
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: var(--r-text-sm);
		color: var(--r-text-muted);
		font-variant-numeric: tabular-nums;
	}
	.link {
		border: 0;
		background: none;
		padding: 0;
		font: inherit;
		color: var(--r-ink);
		text-decoration: underline;
		text-underline-offset: 0.15em;
		cursor: pointer;
		min-height: 1.5rem;
	}
	.track {
		height: 0.1875rem;
		background: var(--r-border);
		border-radius: var(--r-radius-cover);
		overflow: hidden;
	}
	.track i {
		display: block;
		height: 100%;
		background: var(--r-accent);
	}
	@media (max-width: 40rem) {
		.dl {
			flex: 1 1 100%;
		}
		.out {
			align-self: stretch;
			justify-content: center;
		}
	}
</style>
