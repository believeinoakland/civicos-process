import json,glob,sys,re
def drafts(run):
    d=json.load(open(run+'/result.json')); sid=d['session_id']
    f=glob.glob('/root/.claude/projects/*/'+sid+'.jsonl')[0]
    events=[]; last_text=None
    for l in open(f):
        r=json.loads(l); m=r.get('message') or {}; c=m.get('content')
        if r.get('type')=='assistant' and isinstance(c,list):
            t='\n'.join(b['text'] for b in c if b.get('type')=='text')
            if t.strip(): last_text=t
            if any(b.get('type')=='tool_use' for b in c): last_text=None
        if r.get('type')=='system' and r.get('subtype')=='stop_hook_summary':
            events.append(('summary', json.dumps([h.get('command') or h.get('prompt','')[:30] for h in r.get('hookInfos',[])]), r.get('hookErrors'), r.get('preventedContinuation')))
        if r.get('type')=='user' and isinstance(c,str) and c.startswith('Stop hook feedback'):
            events.append(('refused', last_text, c))
        if r.get('type')=='system' and r.get('subtype')=='informational': events.append(('info', r.get('content','')[:200]))
    return d, events
if __name__=='__main__':
    for run in sys.argv[1:]:
        d,ev=drafts(run); print('=====',run, 'turns',d.get('num_turns'))
        for e in ev:
            if e[0]=='refused': print('  DRAFT:', (e[1] or '')[:300].replace('\n',' | ')); print('  REFUSED:', e[2][:400].replace('\n',' | '))
            elif e[0]=='summary': print('  HOOKS:', e[1][:200], 'errors:', str(e[2])[:200])
            else: print('  ', e)
        print('  FINAL:', d.get('result','')[:600].replace('\n',' | '))
