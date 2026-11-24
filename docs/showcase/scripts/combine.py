import csv,sys,json,re,urllib.parse
S=sys.argv[1]; OUTCSV=sys.argv[2]; OUTMD=sys.argv[3]
seeds=list(csv.DictReader(open(f'{S}/seeds.tsv'),delimiter='\t'))
pg=json.load(open(f'{S}/pg_hits.json'))['seeds']
ia=json.load(open(f'{S}/ia_hits.json'))
se={}
for line in open(f'{S}/se_hits.tsv'):
    n,slug,t=line.rstrip('\n').split('\t')
    se[n]=(slug,[x for x in t.split('|') if x])
se.pop('Samuel Johnson (Yoruba historian)',None); se.pop('Alexandre Dumas (fils)',None)
PG_EXCLUDE={'26626','14238','31431','62600','7213','61302'}
# PG: add Charles Thompson from the African American Writers shelf
seeds.append(dict(name='Charles Thompson',pg_match='Thompson, Charles, 1833',region='North America'))
pg['Charles Thompson']=[dict(id='9941',title='Biography of a Slave, Being the Experiences of Rev. Charles Thompson',lang='en',author='Thompson, Charles, 1833-',role='')]
DICTATED={'Sojourner Truth','Nat Turner','Venture Smith','Mary Prince','Charles Ball','Old Elizabeth'}
def norm(t): return re.sub(r'[^a-z0-9]','',t.lower())[:28]
def year_ok(y):
    try: return int(str(y)[:4])<=1930
    except: return False
deaths={}
for f in (f'{S}/dl/wd_pg.csv',f'{S}/dl/wd_ws.csv'):
    for r in csv.DictReader(open(f)):
        d=r.get('death','')
        if re.match(r'\d{4}',d): deaths[r['pLabel'].lower()]=d[:4]
def death(n):
    toks=[t for t in re.sub(r'\(.*?\)','',n).lower().replace('.','').split() if len(t)>1]
    for k,v in deaths.items():
        kk=k.replace('.','')
        if toks and toks[-1] in kk.split() and toks[0] in kk.split(): return v
    return ''

AMBIG={'Old Elizabeth','John Brown (fugitive)','John Thompson','William Parker','Thomas H. Jones','Richard Allen','Samuel Johnson (Yoruba historian)','Francis Williams','Edward A. Johnson','Joseph T. Wilson','George Washington Williams','J. J. Thomas','Amelia E. Johnson','Charles Ball','Noah Davis','David Walker','Samuel Ajayi Crowther','Walter White','John Roy Lynch','William Grimes','Prince Hall','Absalom Jones','Venture Smith','Nat Love','Mary Prince','Nancy Prince','Lucy Terry','Paul Cuffe','James Mars','Peter Randolph','William Still'}
def pat_re(p):
    p=re.sub(r',?\s*(\d{4}.*|approximately.*|\.\*.*)$','',p).strip()
    parts=[re.escape(t.rstrip('.')) for t in re.split(r'[\s,]+',p) if t]
    return re.compile(r'\W+'.join(parts)+r'\b' if len(parts)>1 else r'\b'+parts[0]+r'\b', re.I)
def strict(s, cr, births):
    if s['name']=='Old Elizabeth': return False
    if not any(pat_re(p).search(cr) for p in s['pg_match'].split('|')): return False
    yrs=set(re.findall(r'(1[5-9]\d\d)\??-',cr))
    if yrs and births: return bool(yrs & births)
    if s['name'] in AMBIG: return False
    return True
rows=[]; summary=[]
for s in seeds:
    n=s['name']; seen=set(); r_se=r_pg=r_ia=0; dy=death(n)
    if n in se:
        slug,titles=se[n]
        for t in titles:
            if t==n or t in ('Langston Hughes','Zora Neale Hurston','Alexandre Dumas'): continue
            seen.add(norm(t)); r_se+=1
            rows.append(dict(died=dy,author=n,region=s['region'],source='Standard Ebooks',id=slug,title=t,year='',lang='en',role='',status='cleared (Standard Ebooks US PD check)',url=f'https://standardebooks.org/ebooks/{slug}'))
    for h in pg.get(n,[]):
        if h['id'] in PG_EXCLUDE: continue
        k=norm(h['title']); dup=k in seen; seen.add(k); r_pg+=1
        rows.append(dict(died=dy,author=n,region=s['region'],source='Project Gutenberg',id=h['id'],title=h['title'],year='',lang=h['lang'],role=h['role'],status='cleared (Gutenberg US PD check)'+('; also on Standard Ebooks' if dup else ''),url=f"https://www.gutenberg.org/ebooks/{h['id']}"))
    sur=re.sub(r',.*','',s['pg_match'].split('|')[0]).strip().lower()
    births={m for h in pg.get(n,[]) if h['id'] not in PG_EXCLUDE for m in re.findall(r', (1[5-9]\d\d)\??-',h['author'])}
    births|=set(re.findall(r'(1[5-9]\d\d)',s['pg_match']))
    for h in ia.get(n,{}).get('titles',[]):
        cr=h.get('creator') or ''; cr=' '.join(cr) if isinstance(cr,list) else cr
        if not year_ok(h.get('year')) or not strict(s, cr, births): continue
        if re.search(r'\[(manuscript|letter)',h['title'],re.I) or h['title'].startswith('[Letter'): continue
        k=norm(h['title'])
        if k in seen: continue
        seen.add(k); r_ia+=1
        lang=h.get('lang') or ''; lang=','.join(lang) if isinstance(lang,list) else lang
        rows.append(dict(died=dy,author=n,region=s['region'],source='Internet Archive',id=h['id'],title=h['title'],year=h.get('year',''),lang=lang,role=cr[:80],status='lead: check author, date and scan quality',url=f"https://archive.org/details/{h['id']}"))
    summary.append((n,s['region'],r_se,r_pg,r_ia,se.get(n,(None,))[0],dy))
fields=['author','died','region','source','title','year','lang','role','status','id','url']
w=csv.DictWriter(open(OUTCSV,'w',newline=''),fieldnames=fields,extrasaction='ignore'); w.writeheader(); w.writerows(rows)
json.dump(dict(summary=summary,dictated=sorted(DICTATED)),open(OUTMD,'w'),ensure_ascii=False)
tot=lambda i: sum(x[i] for x in summary)
print('rows',len(rows),'SE',tot(2),'PG',tot(3),'IA',tot(4),'authors with any',sum(1 for x in summary if x[2]+x[3]+x[4]))
print('NONE:',[x[0] for x in summary if not x[2]+x[3]+x[4]])
