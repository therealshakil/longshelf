declare module 'virtual:longshelf/calibre' {
	import type { LibrarySnapshot } from '@longshelf/shared/library/snapshot';
	const snapshot: LibrarySnapshot | null;
	export default snapshot;
}

/** Where library data comes from in a build (vite.config.ts `define`, spec 003). */
declare const __LIBRARY_MODE__: 'sample' | 'mirror';
