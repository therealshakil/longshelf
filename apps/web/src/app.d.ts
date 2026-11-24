// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Identity } from '#lib/server/mirror/access.ts';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** The Access caller (spec 003), or null in a local run with no token. */
			identity: Identity | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
