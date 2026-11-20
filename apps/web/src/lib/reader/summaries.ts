/**
 * Sends finished sections for summarising (spec 002 US4, T049). If the network or AI is away,
 * the request waits in a small local queue and is sent later; with AI switched off it is dropped.
 */
const KEY = 'ribbon.summary-queue.v1';
const MAX_QUEUED = 12; // about 12 chapters of text; older entries give way

export interface SummaryJob {
	bookId: string;
	href: string;
	chapterLabel: string;
	ordinal: number;
	text: string;
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function read(store: Store): SummaryJob[] {
	try {
		return JSON.parse(store.getItem(KEY) ?? '[]') as SummaryJob[];
	} catch {
		return [];
	}
}
function write(store: Store, jobs: SummaryJob[]) {
	try {
		store.setItem(KEY, JSON.stringify(jobs.slice(-MAX_QUEUED)));
	} catch {
		// Storage full or blocked: the summary is simply skipped.
	}
}

/** 'sent', 'dropped' (AI off, or not worth sending), or 'later' (try again). */
async function post(job: SummaryJob, f: typeof fetch): Promise<'sent' | 'dropped' | 'later'> {
	try {
		const r = await f('/api/ai/chapter-summary', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(job)
		});
		if (r.ok) return 'sent';
		if (r.status === 400) return 'dropped';
		const body = (await r.json().catch(() => null)) as { message?: string } | null;
		return body?.message?.includes('ai_off') ? 'dropped' : 'later';
	} catch {
		return 'later';
	}
}

/** Send any queued jobs plus this one, oldest first; keep what couldn't go. */
export async function sendSummary(
	job: SummaryJob | null,
	store: Store = localStorage,
	f: typeof fetch = fetch
): Promise<void> {
	const jobs = read(store);
	if (job && !jobs.some((j) => j.bookId === job.bookId && j.href === job.href)) jobs.push(job);
	const left: SummaryJob[] = [];
	for (const j of jobs) if ((await post(j, f)) === 'later') left.push(j);
	write(store, left);
}
