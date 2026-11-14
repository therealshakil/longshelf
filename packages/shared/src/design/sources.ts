import type { Source } from './meta.ts';

/**
 * Shared source registry, taken from specs/001-visual-design/research.md.
 * Catalogue entries and tokens cite these by key so a source is described once.
 */
const checked = '2026-11-14';

export const S = {
	wcag22: {
		title: 'Web Content Accessibility Guidelines (WCAG) 2.2',
		publisher: 'W3C',
		url: 'https://www.w3.org/TR/WCAG22/',
		checked
	},
	homeOffice: {
		title: "Dos and don'ts on designing for accessibility (autism, dyslexia, anxiety posters)",
		publisher: 'UK Home Office',
		url: 'https://ukhomeoffice.github.io/accessibility-posters/',
		checked
	},
	bda: {
		title: 'Dyslexia-friendly guidance',
		publisher: 'British Dyslexia Association',
		url: 'https://www.bdadyslexia.org.uk/advice/employers/creating-a-dyslexia-friendly-workplace',
		checked
	},
	mq5: {
		title: 'Media Queries Level 5 (user preference media features)',
		publisher: 'W3C',
		url: 'https://www.w3.org/TR/mediaqueries-5/',
		checked
	},
	coga: {
		title: 'Making Content Usable for People with Cognitive and Learning Disabilities',
		publisher: 'W3C',
		url: 'https://www.w3.org/TR/coga-usable/',
		checked
	},
	calmTech: {
		title: 'Calm Technology principles',
		publisher: 'Amber Case',
		url: 'https://calmtech.com/',
		checked
	},
	calmDs: {
		title: 'calm-ds Constitution v0.1.0',
		publisher: 'calm-ds (owner project)',
		checked
	},
	piepenbrock2014: {
		title:
			'Smaller pupil size and better proofreading performance with positive than with negative polarity displays (Piepenbrock, Mayr & Buchner 2014)',
		publisher: 'Ergonomics',
		url: 'https://informahealthcare.com/doi/abs/10.1080/00140139.2014.948496',
		checked
	},
	polarityOverview: {
		title: 'Is bright text on a dark background a good idea? (incl. Dobres et al. 2017)',
		publisher: 'cogsci.nl',
		url: 'https://cogsci.nl/blog/is-bright-text-on-a-dark-background-a-good-idea',
		checked
	},
	atkinson: {
		title: 'Atkinson Hyperlegible Next (Braille Institute; SIL OFL)',
		publisher: 'Google Fonts / Braille Institute',
		url: 'https://github.com/googlefonts/atkinson-hyperlegible-next',
		checked
	},
	literata: {
		title: 'Literata (TypeTogether; SIL OFL)',
		publisher: 'Google Fonts',
		url: 'https://github.com/googlefonts/literata',
		checked
	},
	wery2017: {
		title:
			'The effect of a specialized dyslexia font, OpenDyslexic, on reading rate and accuracy (Wery & Diliberto 2017)',
		publisher: 'Annals of Dyslexia',
		url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5629233',
		checked
	},
	kuster2018: {
		title: 'Dyslexie font does not benefit reading in children with or without dyslexia (Kuster et al. 2018)',
		publisher: 'Annals of Dyslexia',
		url: 'https://dyslexiahelp.umich.edu/latest/does-dyslexie-font-help-dyslexic-readers/',
		checked
	},
	dyson2004: {
		title: 'How physical text layout affects reading from screen (Dyson 2004)',
		publisher: 'Behaviour & Information Technology',
		url: 'https://stu.westga.edu/~ssynan1/literacy/Dyson.pdf',
		checked
	},
	scopeAutism: {
		title: 'Designing for people on the autism spectrum',
		publisher: 'Scope',
		url: 'https://business.scope.org.uk/designing-for-people-on-the-autism-spectrum/',
		checked
	},
	focusView: {
		title: 'FocusView: customising video watching for viewers with ADHD (2025)',
		publisher: 'arXiv',
		url: 'https://arxiv.org/html/2511.01248',
		checked
	}
} as const satisfies Record<string, Source>;

export const assume = (note: string): Source => ({ assumption: true, note });
