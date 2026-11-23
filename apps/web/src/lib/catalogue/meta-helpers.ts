import type { CheckResult, Principle, Source } from '@longshelf/shared/design/meta';
import { isAssumption } from '@longshelf/shared/design/meta';
import type { Token } from '@longshelf/shared/tokens';

/** VII is deferred for every entry while user-adjustable appearance is out of scope (2026-11-14). */
export const VII_DEFERRED: CheckResult = {
	principle: 'VII',
	result: 'deferred',
	reason:
		'Appearance settings are deferred (scope change 2026-11-14). System light/dark, reduced motion and browser zoom are honoured.'
};

/** Build the 7 Check results from per-principle reasons; VII defaults to deferred. */
export function checks(
	results: Partial<Record<Principle, [CheckResult['result'], string]>>
): CheckResult[] {
	const order: Principle[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
	return order.map((principle) => {
		const r = results[principle];
		if (!r) {
			if (principle === 'VII') return VII_DEFERRED;
			throw new Error(`Missing calm-ds check ${principle}`);
		}
		return { principle, result: r[0], reason: r[1] };
	});
}

/** Unique sources across tokens (published sources first, then assumptions). */
export function sourcesOf(tokens: Token[], extra: Source[] = []): Source[] {
	const seen = new Set<string>();
	const all = [...tokens.flatMap((t) => t.sources), ...extra].filter((s) => {
		const key = isAssumption(s) ? `A:${s.note}` : `S:${s.title}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	return [...all.filter((s) => !isAssumption(s)), ...all.filter(isAssumption)];
}
