import csv,sys,re,json
seeds=list(csv.DictReader(open(sys.argv[1]),delimiter='\t'))
rows=list(csv.DictReader(open(sys.argv[2],encoding='utf-8')))
rows=[r for r in rows if r['Type']=='Text']
out={}
for s in seeds:
    pats=[p.strip() for p in s['pg_match'].split('|')]
    hits=[]
    for r in rows:
        auths=r['Authors'].split(';')
        for a in auths:
            a=a.strip()
            if any(re.search(re.escape(p).replace(r'\.\*','.*') if '.*' not in p else p, a) for p in pats):
                role='' if '[' not in a else re.search(r'\[(.*?)\]',a).group(1)
                hits.append(dict(id=r['Text#'],title=r['Title'].replace('\n',' '),lang=r['Language'],author=a,role=role))
                break
    out[s['name']]=hits
# shelf authors not covered
covered={h['id'] for v in out.values() for h in v}
shelf=[r for r in rows if 'African American Writers' in r['Bookshelves'] and r['Text#'] not in covered]
json.dump(dict(seeds=out,shelf_extra=[dict(id=r['Text#'],title=r['Title'],authors=r['Authors']) for r in shelf]),open(sys.argv[3],'w'),ensure_ascii=False,indent=1)
n=0
for k,v in out.items():
    if v: n+=1; print(f"{k}: {len(v)} | "+" ; ".join(f"{h['id']} {h['title'][:50]}{' ['+h['role']+']' if h['role'] else ''}" for h in v[:6]))
print('authors with PG hits:',n,'of',len(out))
print('SHELF EXTRA:')
for r in shelf: print(' ',r['Text#'],r['Title'][:60],'|',r['Authors'][:80])
