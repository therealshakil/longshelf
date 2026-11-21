/**
 * The daily cap on on-demand chapter summaries (DR-0004), so catching up on one long book can't
 * use the allowance other AI features need. Each call reserves its estimate atomically first,
 * because the browser sends chapters in parallel.
 */
import { error } from '@sveltejs/kit';
import { utcDay } from './guard.ts';

export const ON_DEMAND_DAILY = 3000;
const PREFIX = 'on_demand:';

export async function reserveOnDemand(
	db: D1Database,
	neurons: number,
	now = new Date()
): Promise<void> {
	const key = PREFIX + utcDay(now);
	await db
		.prepare('DELETE FROM ai_setting WHERE key LIKE ? AND key <> ?')
		.bind(`${PREFIX}%`, key)
		.run();
	const row = await db
		.prepare(
			`INSERT INTO ai_setting (key, value) VALUES (?1, CAST(?2 AS TEXT))
			 ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS REAL) + ?2 AS TEXT)
			 RETURNING CAST(value AS REAL) AS total`
		)
		.bind(key, neurons)
		.first<{ total: number }>();
	if ((row?.total ?? 0) > ON_DEMAND_DAILY) {
		await releaseOnDemand(db, neurons, now);
		error(503, JSON.stringify({ reason: 'on_demand_paused' }));
	}
}

/** Give a reservation back when the call didn't run. */
export async function releaseOnDemand(
	db: D1Database,
	neurons: number,
	now = new Date()
): Promise<void> {
	await db
		.prepare('UPDATE ai_setting SET value = CAST(CAST(value AS REAL) - ? AS TEXT) WHERE key = ?')
		.bind(neurons, PREFIX + utcDay(now))
		.run();
}
