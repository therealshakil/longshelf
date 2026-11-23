declare module 'virtual:longshelf/calibre' {
	import type { LibrarySnapshot } from '@longshelf/shared/library/snapshot';
	const snapshot: LibrarySnapshot | null;
	export default snapshot;
}
