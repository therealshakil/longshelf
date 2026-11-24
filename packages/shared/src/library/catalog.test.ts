import { describe, expect, it } from 'vitest';
import { canonicalJson, MirrorCatalogSchema } from './catalog.ts';

describe('canonicalJson', () => {
	it('orders keys at every level', () => {
		expect(canonicalJson({ b: 1, a: { d: [{ z: 1, y: 2 }], c: 'x' } })).toBe(
			'{"a":{"c":"x","d":[{"y":2,"z":1}]},"b":1}'
		);
	});
	it('drops undefined and keeps array order', () => {
		expect(canonicalJson({ a: undefined, b: [3, 1, 2] })).toBe('{"b":[3,1,2]}');
	});
	it('gives equal output for equal data written in different orders', () => {
		expect(canonicalJson({ x: 1, y: 2 })).toBe(canonicalJson({ y: 2, x: 1 }));
	});
});

describe('MirrorCatalogSchema', () => {
	it('rejects a file hash that is not lowercase hex', () => {
		const bad = {
			version: 1,
			readAt: '2026-11-24T00:00:00Z',
			books: [],
			news: [],
			files: { b1: [{ format: 'EPUB', sha256: 'ABC', size: 1 }] }
		};
		expect(MirrorCatalogSchema.safeParse(bad).success).toBe(false);
	});
});
