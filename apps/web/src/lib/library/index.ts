import type { LibrarySource } from '@ribbon/shared/library';
import { createSampleLibrary } from '@ribbon/shared/sample';

/**
 * The one place that chooses where library data comes from (spec 002 FR-007).
 * Sample data now; spec 003 swaps in the mirror-backed source here and nowhere else.
 */
export const library: LibrarySource = createSampleLibrary();

export { statusLabel, statusFrom } from '@ribbon/shared/library';
