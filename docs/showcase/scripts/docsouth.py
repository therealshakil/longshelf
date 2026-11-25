import csv,sys,re,glob,collections
seeds=list(csv.DictReader(open(sys.argv[1]),delimiter='\t'))
cand=list(csv.DictReader(open(sys.argv[2])))
toc_dir=sys.argv[3]
def norm(t): return re.sub(r'[^a-z0-9]','',t.lower())[:28]
def toks(s): return [t for t in re.split(r'[\s,.\-]+',s.lower()) if t]
have=collections.defaultdict(set)
for r in cand: have[r['author']].add(norm(r['title']))
import html
def nm(x): return [t for t in re.split(r'[\s,.\-]+',html.unescape(re.sub(r'\(.*?\)','',x)).lower()) if t and t not in ('jr','sr','rev','and')]
def match(author):
    a=nm(author)
    if len(a)<2: return None
    for s in seeds:
        n=nm(s['name'].replace('William and Ellen Craft','William Craft'))
        if s['name']=='Old Elizabeth' or len(n)<2: continue
        if a[-1]!=n[-1]: continue
        f1,f2=a[0],n[0]
        if len(a)>=3 and len(n)>=3 and a[1][0]!=n[1][0]: continue
        if f1==f2 or (min(len(f1),len(f2))==1 and f1[0]==f2[0] and (len(a)<3 or len(n)<3 or a[1][0]==n[1][0])): return s
    return None
WHITE={'Albion Winegar Tourgée','Atticus G. Haygood','B. B. Thatcher','Belle Kearney','Charles Colcock Jones','Charles Emery Stevens','Charles Stuart','Ebenezer W. Warren','Emily Catharine Pierson','Ezekiel Cooper','Frederic May Holland','George Bourne','George Fitzhugh','Grace Lintner','H. G. Adams','Hannah Farnham Sawyer Lee','Henry Bleby','Henry N. Jeter','Isaac T. Hopper','J. R. Beard','Jay S. Stowell','Joanna P. Moore','John Dixon Long','John Gabriel Stedman','John Passmore Edwards','John Warner Barber','John Wesley','Joseph Butsch','Joseph C. Hartzell','Legh Richmond','M. F. Armstrong','Mark Twain','Martha Griffith Browne','Mary Ames','Matilda G. Thompson','Ralph Randolph Gurley','Richard Hildreth','S. H. Platt','Sarah H. Bradford','Stephen Beauregard Weeks','T. C. Upham','T. H. Gallaudet','Theodore Dwight Weld','Thornton Stringfellow','Walter L. Fleming','William A. Smith','William Capers','William E. Hatcher','William Francis Allen','William G. Hawkins','William Greenleaf Eliot','Wilson Armistead','Abigail Mott','Alfred Brockenbrough Williams','Henry Noble Sherwood','Ellwood Griest','Peter Neilson','United States. Bureau of the Census.','Protestant Episcopal Church in the Confederate States of America','William J. Allinson','George White','Charles A. Garlick','Joseph R. Wilson'}
KW=re.compile(r'colou?red|negro|slave|african|freedm|bondage|ethiop|afro',re.I)
COLL={'na-slave-narratives':'North American Slave Narratives','church-southern-black-community':'Church in the Southern Black Community','first-person-narratives-american-south':'First-Person Narratives','library-southern-literature':'Library of Southern Literature'}
out=[];stats=collections.Counter()
for f in sorted(glob.glob(f'{toc_dir}/*/data/toc.csv')):
    coll=f.split('/')[-3]
    for r in csv.DictReader(open(f,encoding='utf-8',errors='replace')):
        y=re.search(r'1[5-9]\d\d',r['Date'] or '')
        if not y or int(y.group())>1930: stats['after 1930 or undated']+=1; continue
        s=match(r['Author'])
        if s:
            if norm(r['Title']) in have[s['name']]: stats['duplicate']+=1; continue
            have[s['name']].add(norm(r['Title']))
            status='cleared (DocSouth, CC BY 4.0, published by 1930)'; author=s['name']; region=s['region']; stats['matched']+=1
        elif html.unescape(re.sub(r'\s+',' ',r['Author']).strip()) in WHITE: stats['excluded (white author)']+=1; continue
        elif coll in ('na-slave-narratives','church-southern-black-community') or KW.search(r['Title']):
            k=('lead',norm(r['Title']))
            if k in have['__lead']: stats['duplicate']+=1; continue
            have['__lead'].add(k)
            status='lead: check the author is of African descent (DocSouth, CC BY 4.0)'; author=html.unescape(re.sub(r'\s+',' ',r['Author']).strip()); region='North America'; stats['lead']+=1
        else: stats['skipped (other authors)']+=1; continue
        url='https://web.archive.org/web/2026/'+r['URL'].replace('http://','https://')
        out.append(dict(author=author,died='',region=region,source='DocSouth ('+COLL[coll]+')',title=html.unescape(re.sub(r'\s+',' ',r['Title'])),year=y.group(),lang='en',role=html.unescape(re.sub(r'\s+',' ',r['Author'])),status=status,id=r['Filename'],url=url))
w=csv.DictWriter(open(sys.argv[2],'a',newline=''),fieldnames=list(cand[0].keys()),extrasaction='ignore'); w.writerows(out)
print(stats)
for o in out:
    if o['status'].startswith('cleared'): print(' +',o['author'],'|',o['title'][:70],o['year'])
print('LEAD AUTHORS:', '; '.join(sorted({o['author'] for o in out if o['status'].startswith('lead')})))
