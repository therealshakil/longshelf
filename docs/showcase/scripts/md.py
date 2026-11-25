import json,sys,urllib.parse as u,re
d=json.load(open(sys.argv[1])); out=open(sys.argv[2],'w')
summ=d['summary']; dictated=set(d['dictated'])
def clean(n): return re.sub(r'\s*\(.*?\)','',n).replace('William and Ellen Craft','William Craft')
def links(n,se_slug):
    q=clean(n)
    L=[]
    if se_slug: L.append(f'[SE](https://standardebooks.org/ebooks/{se_slug})')
    L.append(f'[PG](https://www.gutenberg.org/ebooks/search/?query={u.quote_plus(q)})')
    L.append(f'[IA](https://archive.org/search?query={u.quote_plus(chr(34)+q+chr(34))}&and%5B%5D=mediatype%3A%22texts%22)')
    L.append(f'[Hathi](https://catalog.hathitrust.org/Search/Home?lookfor={u.quote_plus(q)}&type=author&ft=ft)')
    L.append(f'[WS](https://en.wikisource.org/w/index.php?search={u.quote_plus("Author:"+q)})')
    return ' · '.join(L)
tot=lambda i: sum(x[i] for x in summ)
found=[x for x in summ if x[2]+x[3]+x[4]]; none=[x for x in summ if not x[2]+x[3]+x[4]]
w=out.write
w(f"""# Showcase collection: authors of African descent

Candidate books for the public showcase library (`docs/PLAN.md`, Phase 2). Built 2026-11-24.
Copyright rule: **US public domain** ([DR-0011](../decisions/DR-0011-showcase-copyright-rule.md)).

- **{len(summ)} authors searched.** {len(found)} have at least one digital copy, and {len(none)} have none found yet.
- **{tot(2)+tot(3)} cleared books:** {tot(2)} on Standard Ebooks and {tot(3)} on Project Gutenberg. Both sites check US copyright before publishing, so these can go straight in.
- **{tot(4)} archive.org leads:** scans dated 1930 or earlier whose creator matches the author's name. Each one needs checking (right author, first-edition date, scan quality) before it's added.
- **Every book, with links:** [`african-descent-candidates.csv`](african-descent-candidates.csv). Sort by `source`; Standard Ebooks is the best edition, then Gutenberg, then archive.org.

## How this list was built

1. **Authors:** Wikidata (people of African descent with a Gutenberg ID or a Wikisource page),
   Gutenberg's "African American Writers" shelf, and a hand-made list covering the US, the
   Caribbean, Britain, Europe, Latin America and Africa ([seeds](african-descent-seeds.tsv)).
   The hand-made list is from memory (ASSUMPTION: each person's African descent, as commonly
   documented in their biographies).
2. **Standard Ebooks:** each author page was fetched.
3. **Gutenberg:** the full catalogue (`pg_catalog.csv`, from the gutenberg.pglaf.org mirror,
   because gutenberg.org was down for maintenance), matched by author name. Six same-name
   matches were removed by hand.
4. **archive.org:** an advanced search per author, kept only when the full name matches and, if
   both records give one, the birth year matches. Letters and manuscripts were dropped.
5. **Death years:** from Wikidata where available. DR-0011 uses them only if a takedown request
   arrives.

**Gaps:**
- [Documenting the American South](https://docsouth.unc.edu/neh/) refused connections from this
  machine. It holds about 300 slave narratives, many not on Gutenberg, so search it by hand.
- Authors writing in French, Portuguese, Spanish and African languages are under-covered,
  because their books sit in national libraries such as
  [Gallica](https://gallica.bnf.fr) and the [Biblioteca Nacional Digital](https://bndigital.bn.gov.br).
- Several books were dictated to, or written down by, a white editor: {', '.join(sorted(dictated))}.
  Credit both people in the metadata.
- **Coming on 1 January 2027:** books first published in 1931 enter the US public domain.

Link key: SE = Standard Ebooks, PG = Gutenberg search, IA = archive.org search,
Hathi = HathiTrust (full view only), WS = Wikisource.

""")
order=['North America','Caribbean','Britain','Europe','Latin America','Africa']
for reg in order:
    rows=[x for x in found if x[1]==reg]
    if not rows: continue
    w(f"## {reg}\n\n| Author | Died | SE | PG | IA leads | Search |\n|---|---|---|---|---|---|\n")
    for n,_,se,pg,ia,slug,dy in rows:
        w(f"| {n}{' †' if n in dictated else ''} | {dy} | {se or ''} | {pg or ''} | {ia or ''} | {links(n,slug)} |\n")
    w("\n")
w("† Dictated or written down by an editor.\n\n## Nothing found yet\n\nThese searches found nothing. They need a manual search, because names are often catalogued differently (for example \"Hayford, J. E. Casely\").\n\n| Author | Region | Search |\n|---|---|---|\n")
for n,reg,se,pg,ia,slug,dy in none:
    w(f"| {n} | {reg} | {links(n,slug)} |\n")
