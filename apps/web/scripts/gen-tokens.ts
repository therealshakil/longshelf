// Writes src/lib/styles/tokens.css from the token source in packages/shared.
// Run with Node's built-in TypeScript support: `node scripts/gen-tokens.ts`.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tokens, tokensToCss } from '../../../packages/shared/src/tokens/index.ts';

const out = fileURLToPath(new URL('../src/lib/styles/tokens.css', import.meta.url));
const css = tokensToCss(tokens);
if (!existsSync(out) || readFileSync(out, 'utf8') !== css) {
	writeFileSync(out, css);
	console.log('tokens.css updated');
}
