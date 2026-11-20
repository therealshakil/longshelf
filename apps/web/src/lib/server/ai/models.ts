/**
 * Workers AI models (research R4) and a neuron estimate per call (research R5).
 * Model ids are configuration: changing one needs no other code change.
 * Prices and status from `wrangler ai models list` (read 2026-11-20). The first choices
 * (qwen3-30b-a3b, embeddinggemma) were deprecated by Cloudflare on 2026-11-20.
 */
export const MODELS = {
	text: '@cf/google/gemma-4-26b-a4b-it',
	recapStepUp: '@cf/openai/gpt-oss-120b',
	embedding: '@cf/baai/bge-m3'
} as const;

/** USD per million tokens (input, output). */
const PRICE: Record<string, [number, number]> = {
	'@cf/google/gemma-4-26b-a4b-it': [0.1, 0.3],
	'@cf/openai/gpt-oss-120b': [0.35, 0.75],
	'@cf/baai/bge-m3': [0.0118, 0]
};

/** $0.011 per 1,000 neurons. ASSUMPTION: neurons scale linearly with the listed token prices. */
const USD_PER_NEURON = 0.011 / 1000;

/** Rough token count: about 4 characters per token for English. ASSUMPTION. */
export const tokensOf = (text: string) => Math.ceil(text.length / 4);

export function estimateNeurons(model: string, inputTokens: number, outputTokens: number): number {
	const [pin, pout] = PRICE[model] ?? [1, 1];
	const usd = (inputTokens * pin + outputTokens * pout) / 1_000_000;
	return usd / USD_PER_NEURON;
}
