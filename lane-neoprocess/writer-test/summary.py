import json,glob,sys,subprocess,re
sys.path.insert(0,'.'); from analyze import drafts
rows=[]; allfinals={}
for run in sorted(glob.glob('run-[kmx]-*')):
    tag,i=run.split('-')[1],int(run.split('-')[2])
    try: d,ev=drafts(run)
    except Exception as e: rows.append((run,'ERROR',str(e)[:100])); continue
    ref=[e for e in ev if e[0]=='refused']; info=[e for e in ev if e[0]=='info']
    cmd=sum(1 for e in ref if 'PROCESS:' in e[2]); rdr=sum(1 for e in ref if 'Fresh reader' in e[2])
    final=d.get('result','')
    allfinals[run]=final
    rows.append((run,len(ref),cmd,rdr,bool(info),d.get('subtype')))
fin=json.dumps(allfinals)
out=subprocess.run(['node','-e',"import('/home/user/neoprocess/tools/lib.mjs').then(L=>{const f=JSON.parse(require('fs').readFileSync(0,'utf8'));for(const [k,v] of Object.entries(f)){console.log(k+'\\t'+JSON.stringify(L.plainFaults(v)))}})"],input=fin,capture_output=True,text=True).stdout
pf=dict(l.split('\t') for l in out.strip().split('\n'))
for r in rows: print(r, 'final plain faults:', pf.get(r[0]))
json.dump(allfinals,open('finals.json','w'),indent=1)
