import { LEADING, MEASURE, SIZES, type ReaderSettings } from './settings.ts';

/** Token values read from the page, passed into the book's own document (an iframe). */
export interface BookColours {
	/** 'dark' for dark and night, so the book's frame matches the page (no white canvas). */
	scheme: 'light' | 'dark';
	bg: string;
	text: string;
	ink: string;
	muted: string;
	accent: string;
}

export function readColours(el: Element = document.documentElement): BookColours {
	const cs = getComputedStyle(el);
	const v = (n: string) => cs.getPropertyValue(`--r-${n}`).trim();
	const theme = document.documentElement.dataset.theme;
	const dark =
		theme === 'night' ||
		theme === 'dark' ||
		(!theme && matchMedia('(prefers-color-scheme: dark)').matches);
	return {
		scheme: dark ? 'dark' : 'light',
		bg: v('bg'),
		text: v('text'),
		ink: v('ink'),
		muted: v('text-muted'),
		accent: v('accent')
	};
}

/**
 * Book typography, injected into each section (approved reader mock, research R8):
 * Literata at reading size, ragged right, no hyphenation (FR-009), old-style figures,
 * first-line indents with no gaps between paragraphs, quiet chapter openings.
 */
export function bookCss(s: ReaderSettings, c: BookColours, origin: string): string {
	const family =
		s.font === 'atkinson'
			? "'Atkinson Hyperlegible Next', sans-serif"
			: "'Literata', Georgia, serif";
	return `
@font-face { font-family: 'Literata'; src: url('${origin}/fonts/Literata-var.woff2') format('woff2'); font-weight: 200 900; font-style: normal; }
@font-face { font-family: 'Literata'; src: url('${origin}/fonts/Literata-Italic-var.woff2') format('woff2'); font-weight: 200 900; font-style: italic; }
@font-face { font-family: 'Atkinson Hyperlegible Next'; src: url('${origin}/fonts/AtkinsonHyperlegibleNext-var.woff2') format('woff2'); font-weight: 200 800; }
html { color-scheme: ${c.scheme}; background: transparent !important; color: ${c.text} !important; }
body {
	font-family: ${family} !important;
	font-size: ${SIZES[s.size]}rem !important;
	line-height: ${LEADING[s.spacing]} !important;
	max-width: ${MEASURE[s.margins]}em !important;
	margin-inline: auto !important;
	color: ${c.text} !important;
	background: transparent !important;
	hyphens: manual !important;
	-webkit-hyphens: manual !important;
	text-align: start !important;
	font-variant-numeric: oldstyle-nums;
	text-wrap: pretty;
}
p { margin: 0 !important; text-indent: 1.4em; text-align: start !important; }
h1 + p, h2 + p, h3 + p, h4 + p, blockquote + p, hr + p, p:first-child { text-indent: 0; }
h1, h2, h3, h4 { font-family: 'Literata', Georgia, serif; color: ${c.ink} !important; font-weight: 500; line-height: 1.15; text-align: center; margin: 1.5em 0 1em; text-indent: 0; }
blockquote { font-size: 0.85em; font-style: italic; color: ${c.muted} !important; margin: 1em auto 2em; width: fit-content; }
p.poem { font-size: 0.85em; font-style: italic; color: ${c.muted} !important; width: fit-content; margin: 1em auto 2em !important; text-indent: 0; }
.poem + p { text-indent: 0; }
a { color: ${c.accent} !important; }
img { max-width: 100%; height: auto; }
::selection { background: ${c.accent}; color: ${c.bg}; }
`;
}
