import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { ON_DEMAND_DAILY, releaseOnDemand, reserveOnDemand } from './on-demand.ts';

/** Just enough of D1 over node:sqlite to run the real SQL. */
function fakeD1() {
	const sqlite = new DatabaseSync(':memory:');
	sqlite.exec('CREATE TABLE ai_setting (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
	const db = {
		prepare: (sql: string) => ({
			bind: (...args: (string | number)[]) => ({
				run: async () => sqlite.prepare(sql).run(...args),
				first: async () => sqlite.prepare(sql).get(...args)
			})
		})
	} as unknown as D1Database;
	const value = (key: string) =>
		(sqlite.prepare('SELECT value FROM ai_setting WHERE key = ?').get(key) as { value: string })
			?.value;
	return { db, value };
}

const day1 = new Date('2026-11-21T12:00:00Z');
const day2 = new Date('2026-11-22T12:00:00Z');

describe('on-demand daily cap', () => {
	it('adds reservations up', async () => {
		const { db, value } = fakeD1();
		await reserveOnDemand(db, 100, day1);
		await reserveOnDemand(db, 50, day1);
		expect(Number(value('on_demand:2026-11-21'))).toBe(150);
	});
	it('refuses past the cap and gives the refused amount back', async () => {
		const { db, value } = fakeD1();
		await reserveOnDemand(db, ON_DEMAND_DAILY - 10, day1);
		await expect(reserveOnDemand(db, 50, day1)).rejects.toMatchObject({ status: 503 });
		expect(Number(value('on_demand:2026-11-21'))).toBe(ON_DEMAND_DAILY - 10);
	});
	it('releases a reservation', async () => {
		const { db, value } = fakeD1();
		await reserveOnDemand(db, 100, day1);
		await releaseOnDemand(db, 40, day1);
		expect(Number(value('on_demand:2026-11-21'))).toBe(60);
	});
	it('starts again the next UTC day and clears the old count', async () => {
		const { db, value } = fakeD1();
		await reserveOnDemand(db, ON_DEMAND_DAILY, day1);
		await reserveOnDemand(db, 100, day2);
		expect(Number(value('on_demand:2026-11-22'))).toBe(100);
		expect(value('on_demand:2026-11-21')).toBeUndefined();
	});
});
