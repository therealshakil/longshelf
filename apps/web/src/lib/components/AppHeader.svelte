<!--
	App header on every page except the reader: the "Ribbon." wordmark, the Home · Library switch,
	the search field and the sync status (FR-006). Matches design-mocks/index.html.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Search from '@lucide/svelte/icons/search';
	import type { SyncState } from '@ribbon/shared/library';
	import SyncStatus from './SyncStatus.svelte';

	let {
		current,
		sync,
		query = ''
	}: { current: 'home' | 'library' | null; sync: SyncState; query?: string } = $props();
</script>

<header class="flex flex-wrap items-center gap-x-8 gap-y-4 py-4">
	<a class="wordmark no-underline" href={resolve('/')} aria-label="Ribbon, home">
		Ribbon<span class="text-accent" aria-hidden="true">.</span>
	</a>
	<nav aria-label="Main" class="flex gap-6">
		<a class="nav-link" href={resolve('/')} aria-current={current === 'home' ? 'page' : undefined}
			>Home</a
		>
		<a
			class="nav-link"
			href={resolve('/library')}
			aria-current={current === 'library' ? 'page' : undefined}>Library</a
		>
	</nav>
	<form class="search" role="search" action={resolve('/search')}>
		<label
			class="flex h-11 w-full items-center gap-2.5 rounded-pill border border-control bg-raised px-4"
		>
			<Search class="size-5 shrink-0 text-text-muted" aria-hidden="true" />
			<span class="sr-only">Search or ask your library</span>
			<input
				class="min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-text-muted"
				type="search"
				name="q"
				value={query}
				placeholder="Search your library"
			/>
		</label>
	</form>
	<SyncStatus {sync} />
</header>

<style>
	.wordmark {
		font-family: var(--r-font-reading);
		font-size: var(--r-text-xl);
		font-weight: var(--r-weight-title);
		color: var(--r-ink);
		letter-spacing: -0.01em;
	}
	.nav-link {
		color: var(--r-text-muted);
		font-weight: var(--r-weight-strong);
		text-decoration: none;
		padding-block: 0.4rem;
		border-bottom: 0.125rem solid transparent;
	}
	.nav-link:hover {
		color: var(--r-ink);
	}
	.nav-link[aria-current='page'] {
		color: var(--r-ink);
		border-color: var(--r-accent);
	}
	.search {
		flex: 1 1 22rem;
		max-width: 34rem;
		margin-left: auto;
	}
	.search label:focus-within {
		outline: var(--r-focus-width) solid var(--r-focus);
		outline-offset: var(--r-focus-offset);
	}
	@media (max-width: 40rem) {
		.search {
			order: 3;
			flex-basis: 100%;
			max-width: none;
		}
	}
</style>
