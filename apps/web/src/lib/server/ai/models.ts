/**
 * Workers AI models (research R4) and a neuron estimate per call (research R5).
 * Model ids are configuration: changing one needs no other code change.
 * Prices: https://developers.cloudflare.com/workers-ai/platform/pricing/ (read 2026-11-18).
 */
export const MODELS = {
	text: '@cf/qwen/qwen3-30b-a3b-fp8',
	recapStepUp: '@cf/openai/gpt-oss-120b',
	embedding: '@cf/google/embeddinggemma-2'
} as const;

/** USD per million tokens (input, output). */
const PRICE: Record<string, [number, number]> = {
	'@cf/qwen/qwen3-30b-a3b-fp8': [0.051, 0.335],
	'@cf/openai/gpt-oss-120b': [0.35, 0.75],
	'@cf/google/embeddinggemma-2': [0.0017, 0]
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
