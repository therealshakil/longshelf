import { error } from '@sveltejs/kit';
import { check, record, type GuardStore } from './guard.ts';
import { estimateNeurons, tokensOf } from './models.ts';

type Message = { role: 'system' | 'user'; content: string };

/** Text from a Workers AI chat response, in either of the shapes models return. */
function textOf(out: unknown): string {
	const o = out as {
		response?: string;
		choices?: { message?: { content?: string } }[];
	};
	const raw = o.response ?? o.choices?.[0]?.message?.content ?? '';
	// Some models think aloud first; keep only the answer.
	return raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

/**
 * One guarded text call: refuses when AI is off or the day's ceiling would be passed (FR-016,
 * FR-017), then records the estimated cost.
 */
export async function runText(
	ai: Ai | null,
	store: GuardStore,
	model: string,
	messages: Message[],
	maxTokens: number
): Promise<string> {
	if (!ai) error(503, JSON.stringify({ reason: 'offline' }));
	const inTokens = tokensOf(messages.map((m) => m.content).join('\n'));
	const guard = await check(store, estimateNeurons(model, inTokens, maxTokens));
	if (!guard.ok) error(503, JSON.stringify({ reason: guard.reason }));
	let out: unknown;
	try {
		out = await (ai.run as (m: string, i: unknown) => Promise<unknown>)(model, {
			messages,
			max_completion_tokens: maxTokens,
			// Answer directly: thinking would spend the token budget before any text (2026-11-20).
			chat_template_kwargs: { enable_thinking: false }
		});
	} catch (e) {
		console.error('Workers AI call failed:', model, e instanceof Error ? e.message : e);
		error(503, JSON.stringify({ reason: 'offline' }));
	}
	const text = textOf(out);
	if (!text) console.error('Workers AI returned no text:', JSON.stringify(out).slice(0, 1500));
	await record(store, estimateNeurons(model, inTokens, tokensOf(text)));
	return text;
}
