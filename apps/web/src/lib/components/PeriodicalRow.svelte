<!--
	Periodical issues as their cover with the date beneath, or a plain binding (publication and
	date) when an issue has no cover, newest first, "New" on unopened
	issues, scrolling sideways when there are many. Never mixed into Recently added (US8).
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PeriodicalIssue } from '@longshelf/shared/library';
	import { statusLabel } from '@longshelf/shared/library';

	let { issues, label }: { issues: PeriodicalIssue[]; label: string } = $props();

	const status = (i: PeriodicalIssue) =>
		i.status === 'finished'
			? statusLabel({ kind: 'finished' })
			: i.status === 'in-progress' && i.percent
				? statusLabel({ kind: 'in-progress', percent: i.percent })
				: null;
</script>

<ul class="issues" aria-label={label}>
	{#each issues as issue (issue.id)}
		<li>
			<a class="issue" href={resolve('/read/[id]', { id: issue.id })}>
				{#if issue.cover}
					<img class="cover" src={issue.cover.url} alt="" loading="lazy" />
				{:else}
					<span class="binding">
						<b>{issue.publication}</b>
						<em>{issue.issueLabel}</em>
					</span>
				{/if}
				<span class="sr-only">{issue.publication}, {issue.issueLabel}</span>
			</a>
			{#if issue.cover}<span class="date" aria-hidden="true">{issue.issueLabel}</span>{/if}
			{#if issue.status === 'new'}<span class="new">New</span>{/if}
			{#if status(issue)}<span class="st">{status(issue)}</span>{/if}
		</li>
	{/each}
</ul>

<style>
	.issues {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 7.5rem;
		gap: 1.25rem;
		overflow-x: auto;
		padding: 0 0 0.5rem;
		margin: 0;
		list-style: none;
	}
	li {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.issue {
		text-decoration: none;
	}
	.binding {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		aspect-ratio: 2 / 3;
		padding: 0.75rem 0.6rem;
		border-radius: var(--r-radius-cover);
		background: color-mix(in oklab, var(--r-bg), var(--r-ink) 9%);
		box-shadow: var(--r-shadow-tile);
		color: var(--r-ink);
	}
	.binding b {
		font-family: var(--r-font-reading);
		font-weight: var(--r-weight-title);
		font-size: var(--r-text-sm);
		line-height: var(--r-leading-tight);
	}
	.binding em {
		font-style: normal;
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
		border-top: 1px solid var(--r-border);
		padding-top: 0.4rem;
	}
	.cover {
		display: block;
		width: 100%;
		aspect-ratio: 2 / 3;
		object-fit: cover;
		border-radius: var(--r-radius-cover);
		background: var(--r-surface);
		box-shadow: var(--r-shadow-tile);
	}
	.date {
		font-size: var(--r-text-xs);
		color: var(--r-text-muted);
	}
	.issue:hover .cover,
	.issue:hover .binding {
		outline: 1px solid var(--r-control);
	}
	.new {
		font-size: var(--r-text-xs);
		font-weight: var(--r-weight-strong);
		color: var(--r-accent);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.st {
		font-size: var(--r-text-xs);
		color: var(--r-text);
	}
</style>
