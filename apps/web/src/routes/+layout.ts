import { library } from '#lib/library/index.ts';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => ({ sync: await library.syncStatus() });
