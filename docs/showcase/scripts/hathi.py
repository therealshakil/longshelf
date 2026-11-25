"""Match the authors list against a HathiTrust full Hathifile.

Usage: python3 -I hathi.py <hathi_full_*.txt.gz> <seeds.tsv> <candidates.csv> <out.csv>

Keeps only records HathiTrust has opened as public domain (rights pd or pdus), because the
showcase is public domain only. One row per HathiTrust catalogue record.
"""
import csv, gzip, re, sys, collections

HATHI, SEEDS, CAND, OUT = sys.argv[1:5]
csv.field_size_limit(10**8)

# Hathifile columns, per https://www.hathitrust.org/member-libraries/resources-for-librarians/data-resources/hathifiles/
COLS = ['htid', 'access', 'rights', 'ht_bib_key', 'description', 'source', 'source_bib_num',
        'oclc_num', 'isbn', 'issn', 'lccn', 'title', 'imprint', 'rights_reason_code',
        'rights_timestamp', 'us_gov_doc_flag', 'rights_date_used', 'pub_place', 'lang',
        'bib_fmt', 'collection_code', 'content_provider_code', 'responsible_entity_code',
        'digitization_agent_code', 'access_profile_code', 'author']
RIGHTS_RANK = {'pd': 0, 'pdus': 1, 'cc-zero': 0, 'cc-by-4.0': 0, 'cc-by-3.0': 0}

seeds = list(csv.DictReader(open(SEEDS), delimiter='\t'))
cand = list(csv.DictReader(open(CAND)))

# Known years per author: birth years from matched archive.org creators, death years from Wikidata.
births, deaths = collections.defaultdict(set), {}
for r in cand:
    if r['died']:
        deaths[r['author']] = r['died']
    if r['source'] == 'Internet Archive':
        births[r['author']] |= set(re.findall(r'(1[5-9]\d\d)\??-', r['role']))

authors = []  # (name, region, [patterns])
for s in seeds:
    births[s['name']] |= set(re.findall(r'(1[5-9]\d\d)', s['pg_match']))
    pats = [re.sub(r',?\s*(\d{4}.*|approximately.*|\.\*.*)$', '', p).strip() for p in s['pg_match'].split('|')]
    authors.append((s['name'], s['region'], pats))
# DocSouth-only authors are left out: no known dates, so same-name matches can't be told apart.



def pat_re(p):
    if ',' not in p:
        return re.compile(r'^' + re.escape(p) + r'\b', re.I)
    sur, given = p.split(',', 1)
    toks = [re.escape(t.rstrip('.')) for t in re.split(r'[\s,]+', given) if t]
    return re.compile(r'^' + re.escape(sur.strip()) + r',\s*' + r'\W+'.join(toks) + r'\b', re.I)


first_tok = collections.defaultdict(list)
for name, region, pats in authors:
    ntok = len([t for t in re.split(r'[\s,]+', pats[0]) if len(t.rstrip('.')) > 1])
    entry = (name, region, [pat_re(p) for p in pats], ntok)
    for key in {p.split(',')[0].strip().lower() for p in pats}:
        first_tok[key].append(entry)


def accept(name, full_tokens, author_field):
    """Same-name guard: match known birth or death year; without known years, need a full 3-part name."""
    yrs = re.findall(r'(1[5-9]\d\d)\??-(1[5-9]\d\d)?', author_field)
    known_b, known_d = births.get(name, set()), deaths.get(name)
    if yrs and (known_b or known_d):
        b, d = yrs[0]
        return (b in known_b) or bool(d and d == known_d)
    return full_tokens >= 3


records = {}
with gzip.open(HATHI, 'rt', encoding='utf-8', errors='replace') as f:
    for line in f:
        row = line.rstrip('\n').split('\t')
        if len(row) < len(COLS):
            continue
        rec = dict(zip(COLS, row))
        if rec['rights'] not in ('pd', 'pdus'):
            continue
        a = rec['author'].strip()
        if not a:
            continue
        sur = a.split(',')[0].strip().lower()
        for name, region, rxs, ntok in first_tok.get(sur, []):
            if any(rx.search(a) for rx in rxs) and accept(name, ntok, a):
                key = rec['ht_bib_key']
                prev = records.get(key)
                rank = RIGHTS_RANK.get(rec['rights'], 9)
                if not prev or rank < prev['rank']:
                    records[key] = dict(author=name, region=region, title=rec['title'], year=rec['rights_date_used'],
                                        lang=rec['lang'], rights=rec['rights'], rank=rank, htid=rec['htid'],
                                        hathi_author=a, imprint=rec['imprint'])
                break

with open(OUT, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['author', 'region', 'title', 'year', 'lang', 'rights', 'hathi_author', 'imprint', 'record_url', 'read_url'])
    for key, r in sorted(records.items(), key=lambda kv: (kv[1]['author'], kv[1]['title'])):
        w.writerow([r['author'], r['region'], r['title'], r['year'], r['lang'], r['rights'], r['hathi_author'], r['imprint'],
                    f'https://catalog.hathitrust.org/Record/{key}', f'https://babel.hathitrust.org/cgi/pt?id={r["htid"]}'])
c = collections.Counter(r['rights'] for r in records.values())
print('records', len(records), 'authors', len({r['author'] for r in records.values()}), dict(c.most_common()))
