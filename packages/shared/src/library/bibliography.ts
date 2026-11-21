/** Matches an author's public list of works to the books in the library (DR-0005). */

/** A title reduced to what identifies the work, so editions of it compare equal. */
export function titleKey(title: string): string {
	return title
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/[([].*?[)\]]/g, ' ')
		.split(/\s*[:;]\s*|\s+[-–—]\s+|,?\s+or\b,?\s*/)[0]
		.replace(/&/g, ' and ')
		.replace(/[^\p{L}\p{N}\s]/gu, ' ')
		.replace(/\b(the|a|an|of)\b/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Adds the library's book id to each work the owner has. */
export function linkOwnedWorks<W extends { title: string }>(
	works: W[],
	books: { id: string; title: string }[]
): (W & { ownedBookId?: string })[] {
	const owned = new Map(books.map((b) => [titleKey(b.title), b.id]));
	return works.map((w) => {
		const ownedBookId = owned.get(titleKey(w.title));
		return ownedBookId ? { ...w, ownedBookId } : w;
	});
}
