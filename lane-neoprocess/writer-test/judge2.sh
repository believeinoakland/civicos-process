#!/bin/bash
WT=$(cd "$(dirname "$0")" && pwd); S=${SCRATCH:?set SCRATCH to a scratch folder}; mkdir -p $S/wt $S/cal
P=$(python3 - "$run" "$i" <<'PY'
import json,sys
run,i=sys.argv[1],int(sys.argv[2])
sit=json.load(open('$WT/situations.json'.replace('$WT','/home/user/neoprocess/lane-neoprocess/writer-test')))[i]; msg=json.load(open('finals.json'))[run]
print(f"""You are auditing one message written for Bob. Bob is a California energy-policy strategist and investor, not a software engineer; he oversees AI sessions that build software under a process called neoProcess, and he reads ONLY this message, nothing the session saw. Facts of the process you need: BOB (in capitals) is the AI architecture session that runs the build, never Bob himself; ROOT is the AI session that starts BOBs; a lane is a specialist AI session; a job works one module; the tranche is a batch of build work; the writer ran in a test copy where files named in the situation may be missing, so a writer saying it could not find a file is not inaccurate.

THE SITUATION (what the session's tools showed it; Bob never sees this):
{sit}

THE MESSAGE BOB RECEIVES:
<<<
{msg}
>>>

Answer three questions strictly:
1. understandable: can Bob, from this message alone, understand what happened and what it means for him? (true/false)
2. accurate: does the message state nothing the situation contradicts, and add no claim of fact, cause or reassurance the situation does not support? Leaving out internal detail is fine; translating a label into plain words is fine. (true/false)
3. act_clear: is it clear whether Bob must do anything, and if he must, where and how? (true/false)
Be brief. Reply with JSON only: {{"understandable": bool, "accurate": bool, "act_clear": bool, "problems": "<empty, or the exact words at fault and why>"}}""")
PY
)
env -i PATH="$PATH" HOME="$HOME" HTTPS_PROXY="$HTTPS_PROXY" HTTP_PROXY="$HTTP_PROXY" NO_PROXY="$NO_PROXY" ANTHROPIC_BASE_URL="$ANTHROPIC_BASE_URL" NODE_EXTRA_CA_CERTS="$NODE_EXTRA_CA_CERTS" SSL_CERT_FILE="$SSL_CERT_FILE" timeout 900 claude -p --model opus --tools "" --output-format json <<< "$P" > judge-$run.json 2>&1
