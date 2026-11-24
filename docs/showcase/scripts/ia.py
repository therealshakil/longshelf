import csv,sys,json,time,urllib.request,urllib.parse,re
seeds=list(csv.DictReader(open(sys.argv[1]),delimiter='\t'))
res={}
def norm(t): return re.sub(r'[^a-z0-9 ]','',t.lower())[:40]
for s in seeds:
    p=s['pg_match'].split('|')[0]
    p=re.sub(r',?\s*(\d{4}|approximately.*|\.\*.*)$','',p).strip()
    parts=[x.strip() for x in p.split(',')]
    sur=parts[0]; given=parts[1] if len(parts)>1 else ''
    q=f'creator:("{sur}") AND mediatype:texts AND year:[1500 TO 1930]'
    toks=[t.rstrip('.') for t in given.split() if len(t.rstrip('.'))>1]
    for t in toks: q+=f' AND creator:({t})'
    url='https://archive.org/advancedsearch.php?'+urllib.parse.urlencode([('q',q),('fl[]','identifier'),('fl[]','title'),('fl[]','year'),('fl[]','creator'),('fl[]','language'),('rows','300'),('output','json'),('sort[]','downloads desc')])
    try:
        d=json.load(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=60))
        docs=d['response']['docs']; n=d['response']['numFound']
    except Exception as e:
        docs=[];n=-1
    seen={}
    for x in docs:
        t=x.get('title',''); t=t if isinstance(t,str) else t[0]
        k=norm(t)
        if k and k not in seen: seen[k]=dict(id=x['identifier'],title=t,year=x.get('year'),creator=x.get('creator'),lang=x.get('language'))
    res[s['name']]=dict(query=q,found=n,titles=list(seen.values()))
    print(f"{s['name']}: {n} items, {len(seen)} distinct titles",flush=True)
    time.sleep(1)
json.dump(res,open(sys.argv[2],'w'),ensure_ascii=False,indent=1)
