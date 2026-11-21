/**
 * Recap quality check (spec 002 SC-004, DR-0004). Builds 20 recaps at set places in three sample
 * books with the shipped window and prompts, then writes each beside the next chapter for the
 * owner to judge. Finished summaries are cached, so a run stopped by the budget resumes.
 *
 *   pnpm eval:recaps --dry-run    chapters and estimated cost, no AI calls
 *   pnpm eval:recaps              run on the default model
 *   pnpm eval:recaps --step-up    write the recaps with the step-up model (FR-018)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { getPlatformProxy } from 'wrangler';
import { fillMissing } from '../src/lib/ai/backfill.ts';
import type { GuardStore } from '../src/lib/server/ai/guard.ts';
import { estimateNeurons, MODELS, tokensOf } from '../src/lib/server/ai/models.ts';
import {
	RECAP_SYSTEM,
	summariseChapter,
	summaryNeurons,
	writeRecap
} from '../src/lib/server/ai/story.ts';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(WEB, '.eval', 'recaps');
/** Leaves room in the day's 10,000 free neurons for anything else on the account. */
const DAILY_BUDGET = 6000;

const BOOKS = [
	{
		id: 'george-eliot_middlemarch',
		story: /^(prelude|finale|chapter\b)/i,
		cuts: [0.08, 0.22, 0.36, 0.5, 0.64, 0.78, 0.92]
	},
	{
		id: 'herman-melville_moby-dick',
		story: /^(chapter\b|epilogue)/i,
		cuts: [0.08, 0.22, 0.36, 0.5, 0.64, 0.78, 0.92]
	},
	{ id: 'bram-stoker_dracula', story: /^chapter\b/i, cuts: [0.12, 0.28, 0.44, 0.6, 0.76, 0.92] }
];

interface Chapter {
	label: string;
	href: string;
	text: string;
}

function unzip(path: string): Map<string, () => Buffer> {
	const b = readFileSync(path);
	let end = b.length - 22;
	while (end >= 0 && b.readUInt32LE(end) !== 0x06054b50) end--;
	if (end < 0) throw new Error(`Not a zip file: ${path}`);
	const files = new Map<string, () => Buffer>();
	let p = b.readUInt32LE(end + 16);
	for (let n = b.readUInt16LE(end + 10); n > 0; n--) {
		const [nameLen, extraLen, noteLen] = [28, 30, 32].map((o) => b.readUInt16LE(p + o));
		const method = b.readUInt16LE(p + 10);
		const size = b.readUInt32LE(p + 20);
		const at = b.readUInt32LE(p + 42);
		files.set(b.toString('utf8', p + 46, p + 46 + nameLen), () => {
			const start = at + 30 + b.readUInt16LE(at + 26) + b.readUInt16LE(at + 28);
			const data = b.subarray(start, start + size);
			return method === 8 ? inflateRawSync(data) : Buffer.from(data);
		});
		p += 46 + nameLen + extraLen + noteLen;
	}
	return files;
}

const ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	mdash: '—',
	ndash: '–',
	rsquo: '’',
	lsquo: '‘',
	rdquo: '”',
	ldquo: '“'
};
const decode = (s: string) =>
	s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) => {
		if (e[0] !== '#') return ENTITIES[e] ?? m;
		return String.fromCodePoint(
			e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
		);
	});

/** Page text, plus where each id or anchor name falls in it. */
function pageText(xml: string) {
	const marks = new Map<string, number>();
	let text = '';
	let skip = 0;
	for (const m of xml.matchAll(/<(\/?)([a-zA-Z0-9:]+)([^>]*)>|([^<]+)/g)) {
		if (m[4] !== undefined) {
			if (!skip) text += decode(m[4]);
			continue;
		}
		const tag = m[2].toLowerCase();
		const selfClosed = m[3].endsWith('/');
		if (['script', 'style', 'head'].includes(tag) && !selfClosed) skip += m[1] ? -1 : 1;
		if (m[1]) continue;
		for (const a of m[3].matchAll(/\b(?:id|name)="([^"]+)"/g))
			if (!marks.has(a[1])) marks.set(a[1], text.length);
		if (/^(p|div|br|h[1-6]|li)$/.test(tag)) text += ' ';
	}
	return { text, marks };
}

function readChapters(path: string, story: RegExp): Chapter[] {
	const zip = unzip(path);
	const read = (name: string) => {
		const f = zip.get(name);
		if (!f) throw new Error(`Missing ${name} in ${path}`);
		return f().toString('utf8');
	};
	const opfPath = /full-path="([^"]+)"/.exec(read('META-INF/container.xml'))![1];
	const opf = read(opfPath);
	const ncx = /<item\b[^>]*href="([^"]+\.ncx)"/.exec(opf)?.[1];
	if (!ncx) throw new Error(`No NCX contents in ${path}`);
	const ncxPath = posix.normalize(posix.join(posix.dirname(opfPath), ncx));
	const entries = [
		...read(ncxPath).matchAll(
			/<navLabel>\s*<text>([\s\S]*?)<\/text>\s*<\/navLabel>\s*<content[^>]*src="([^"]+)"/g
		)
	].map((m) => {
		const [file, anchor] = m[2].split('#');
		return {
			label: decode(m[1]).replace(/\s+/g, ' ').trim(),
			href: m[2],
			file: posix.normalize(posix.join(posix.dirname(ncxPath), decodeURIComponent(file))),
			anchor
		};
	});
	const pages = new Map<string, ReturnType<typeof pageText>>();
	const page = (file: string) => {
		if (!pages.has(file)) pages.set(file, pageText(read(file)));
		return pages.get(file)!;
	};
	const placed = entries
		.filter((e) => zip.has(e.file))
		.map((e) => ({ ...e, at: e.anchor ? (page(e.file).marks.get(e.anchor) ?? 0) : 0 }));
	return placed
		.map((e, i) => {
			const next = placed[i + 1];
			const pageBody = page(e.file).text;
			const body = pageBody.slice(e.at, next?.file === e.file ? next.at : undefined);
			const text = body
				.split(/\*\*\* ?END OF TH/)[0]
				.replace(/\s+/g, ' ')
				.trim();
			return { label: e.label, href: e.href, text };
		})
		.filter((c) => story.test(c.label) && c.text.length >= 400);
}

/** Capitalised words not at a sentence start: a rough list of names. */
const names = (text: string) =>
	new Set(text.match(/(?<![.!?:;"“‘]\s)(?<!^)\b[A-Z][a-zà-ÿ]{2,}\b/g) ?? []);
const words = (text: string) => new Set(text.match(/\b[A-Z]?[a-zà-ÿ]{2,}\b/g) ?? []);

/** Names in the recap that first appear in the book only after the reader's place. */
function laterOnlyNames(recap: string, before: Chapter[], after: Chapter[]): string[] {
	const seen = words(before.map((c) => c.text).join(' '));
	const later = words(after.map((c) => c.text).join(' '));
	return [...names(recap)].filter((n) => !seen.has(n) && later.has(n));
}

type Cache = {
	summaries: Record<string, string>;
	recaps: Record<string, { paragraphs: string[]; model: string }>;
	usage: Record<string, number>;
};

async function main() {
	const dryRun = process.argv.includes('--dry-run');
	const stepUp = process.argv.includes('--step-up');
	mkdirSync(OUT, { recursive: true });
	const cachePath = join(OUT, 'cache.json');
	const cache: Cache = existsSync(cachePath)
		? JSON.parse(readFileSync(cachePath, 'utf8'))
		: { summaries: {}, recaps: {}, usage: {} };
	const save = () => writeFileSync(cachePath, JSON.stringify(cache));

	const store: GuardStore = {
		usage: async (day) => ({ neuronsEst: cache.usage[day] ?? 0, calls: 0 }),
		add: async (day, n) => {
			cache.usage[day] = (cache.usage[day] ?? 0) + n;
			save();
		},
		setting: async (key) => (key === 'ceiling' ? String(DAILY_BUDGET) : null),
		setSetting: async () => {}
	};

	const proxy = dryRun ? null : await getPlatformProxy<{ AI: Ai }>({ remoteBindings: true });
	const ai = proxy?.env.AI ?? null;
	const recapModel = stepUp ? MODELS.recapStepUp : MODELS.text;
	const results = [];
	let estimate = 0;
	let stopped: string | null = null;
	const planned = new Set<string>();

	try {
		outer: for (const book of BOOKS) {
			const chapters = readChapters(
				join(WEB, 'static/sample/books', `${book.id}.epub`),
				book.story
			);
			for (const cut of book.cuts) {
				const upto = Math.max(1, Math.round(chapters.length * cut));
				const rows: { ordinal: number; chapter_label: string; summary: string }[] = [];
				const f = (async (_url: string, init?: RequestInit) => {
					if (!init?.method) return Response.json({ ordinals: [] });
					const job = JSON.parse(String(init.body)) as {
						ordinal: number;
						chapterLabel: string;
						text: string;
					};
					const key = `${book.id}:${job.ordinal}`;
					if (dryRun) {
						if (!planned.has(key) && !cache.summaries[key]) {
							planned.add(key);
							estimate += summaryNeurons(job.text.length);
						}
						return Response.json({});
					}
					try {
						cache.summaries[key] ??=
							(await summariseChapter(ai, store, job.chapterLabel, job.text))?.summary ?? '';
						save();
					} catch (e) {
						const message = (e as { body?: { message?: string } }).body?.message;
						return Response.json({ message }, { status: 503 });
					}
					if (cache.summaries[key])
						rows.push({
							ordinal: job.ordinal,
							chapter_label: job.chapterLabel,
							summary: cache.summaries[key]
						});
					return Response.json({});
				}) as typeof fetch;
				const fill = await fillMissing({
					bookId: book.id,
					upto,
					chapter: async (i) => chapters[i],
					f
				});
				const recapKey = `${book.id}:${upto}:${recapModel}`;
				if (dryRun) {
					if (!cache.recaps[recapKey])
						estimate += estimateNeurons(recapModel, tokensOf(RECAP_SYSTEM) + 4000, 700);
					console.log(
						`${book.id} before ${chapters[upto]?.label}: ${upto} of ${chapters.length} chapters, ${fill.earlier.chapters} left out of the window`
					);
					continue;
				}
				if (fill.status !== 'done') {
					stopped = fill.status;
					break outer;
				}
				rows.sort((a, b) => a.ordinal - b.ordinal);
				if (!cache.recaps[recapKey]) {
					const saved = MODELS.text;
					(MODELS as { text: string }).text = recapModel;
					try {
						cache.recaps[recapKey] = await writeRecap(ai, store, rows);
						save();
					} catch {
						stopped = 'ai_paused';
						break outer;
					} finally {
						(MODELS as { text: string }).text = saved;
					}
				}
				const recap = cache.recaps[recapKey];
				const next = chapters[upto];
				results.push({
					book: book.id,
					place: `${upto} of ${chapters.length} chapters read`,
					covers: `${rows[0]?.chapter_label} to ${rows.at(-1)?.chapter_label}`,
					leftOut: fill.earlier.chapters,
					model: recap.model,
					paragraphs: recap.paragraphs,
					laterOnlyNames: laterOnlyNames(
						recap.paragraphs.join(' '),
						chapters.slice(0, upto),
						chapters.slice(upto)
					),
					nextLabel: next?.label ?? '(end)',
					nextText: next?.text ?? ''
				});
				console.log(`${results.length}/20 ${book.id} ${chapters[upto]?.label}`);
			}
		}
	} finally {
		await proxy?.dispose();
	}

	if (dryRun) {
		console.log(`Estimated cost still to spend: ${Math.round(estimate)} neurons`);
		return;
	}
	const review = results
		.map(
			(r, i) =>
				`## ${i + 1}. ${r.book}\n\n${r.place}. Covers ${r.covers}` +
				`${r.leftOut ? ` (${r.leftOut} earlier chapters left out)` : ''}. Model: ${r.model}.\n\n` +
				`**Automatic flag, names found only later in the book:** ${r.laterOnlyNames.join(', ') || 'none'}\n\n` +
				`**Mentions anything after the cut-off? yes / no**\n\n### Recap\n\n${r.paragraphs.join('\n\n')}\n\n` +
				`### Next chapter: ${r.nextLabel}\n\n${r.nextText}\n`
		)
		.join('\n---\n\n');
	writeFileSync(join(OUT, 'review.md'), `# Recap review (SC-004, pass = 0 of 20)\n\n${review}`);
	writeFileSync(join(OUT, 'results.json'), JSON.stringify(results, null, 1));
	const spent = Object.values(cache.usage).reduce((a, b) => a + b, 0);
	console.log(
		`${results.length} of 20 recaps. Estimated spend so far: ${Math.round(spent)} neurons.`
	);
	if (stopped) console.log(`Stopped early (${stopped}). Run again after 00:00 UTC to resume.`);
	console.log(`Review: ${join(OUT, 'review.md')}`);
}

await main();
