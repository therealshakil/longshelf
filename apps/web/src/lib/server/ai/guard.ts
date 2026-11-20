/**
 * Spend guard (FR-016, FR-017): every AI call asks first. Calls stop for the UTC day once the
 * estimate reaches the ceiling (default 8,000 of the free 10,000 neurons), and stop entirely
 * while the owner has AI switched off.
 */
export const DEFAULT_CEILING = 8000;

export interface GuardStore {
	usage(day: string): Promise<{ neuronsEst: number; calls: number }>;
	add(day: string, neurons: number): Promise<void>;
	setting(key: string): Promise<string | null>;
	setSetting(key: string, value: string): Promise<void>;
}

export type GuardResult = { ok: true } | { ok: false; reason: 'ai_off' | 'ai_paused' };

export const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

export async function isEnabled(store: GuardStore): Promise<boolean> {
	return (await store.setting('enabled')) !== 'false';
}

export async function ceiling(store: GuardStore): Promise<number> {
	const v = Number(await store.setting('ceiling'));
	return Number.isFinite(v) && v > 0 ? v : DEFAULT_CEILING;
}

/** Check before a call that is expected to cost `neurons`. */
export async function check(
	store: GuardStore,
	neurons: number,
	now = new Date()
): Promise<GuardResult> {
	if (!(await isEnabled(store))) return { ok: false, reason: 'ai_off' };
	const used = (await store.usage(utcDay(now))).neuronsEst;
	if (used + neurons > (await ceiling(store))) return { ok: false, reason: 'ai_paused' };
	return { ok: true };
}

/** Record what a call actually cost (estimated from its tokens). */
export const record = (store: GuardStore, neurons: number, now = new Date()) =>
	store.add(utcDay(now), neurons);

/** D1-backed store (tables ai_usage and ai_setting, migrations/0001_ai.sql). */
export function d1Store(db: D1Database): GuardStore {
	return {
		async usage(day) {
			const row = await db
				.prepare('SELECT neurons_est AS n, calls AS c FROM ai_usage WHERE day = ?')
				.bind(day)
				.first<{ n: number; c: number }>();
			return { neuronsEst: row?.n ?? 0, calls: row?.c ?? 0 };
		},
		async add(day, neurons) {
			await db
				.prepare(
					`INSERT INTO ai_usage (day, neurons_est, calls) VALUES (?, ?, 1)
					 ON CONFLICT(day) DO UPDATE SET neurons_est = neurons_est + excluded.neurons_est, calls = calls + 1`
				)
				.bind(day, neurons)
				.run();
		},
		async setting(key) {
			const row = await db
				.prepare('SELECT value FROM ai_setting WHERE key = ?')
				.bind(key)
				.first<{ value: string }>();
			return row?.value ?? null;
		},
		async setSetting(key, value) {
			await db
				.prepare(
					'INSERT INTO ai_setting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
				)
				.bind(key, value)
				.run();
		}
	};
}
