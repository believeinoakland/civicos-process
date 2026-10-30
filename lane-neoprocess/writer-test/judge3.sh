#!/bin/bash
# $1 a run folder (run-<tag>-<i>) under the current folder, beside its finals.json: the same three questions as judge2.sh,
# judged against what the writer itself saw (its transcript's messages, commands and tool output, as the evidence check
# reads them; tools/lib.mjs turnEvidence), not only the situation, so a claim sourced in the process text is not counted
# as added. Writes judge3-<run>.json.
S=${SCRATCH:?set SCRATCH to a scratch folder}; run=$1
sid=$(python3 -c "import json;print(json.load(open('$run/result.json'))['session_id'])")
T=$(ls /root/.claude/projects/*/$sid.jsonl | head -1)
P=$(node --input-type=module - "$T" "$run" <<'JS'
import { readFileSync } from 'node:fs';
const L = await import('/home/user/neoprocess/tools/lib.mjs');
const [t, run] = process.argv.slice(2);
const rows = readFileSync(t, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const msg = JSON.parse(readFileSync('finals.json', 'utf8'))[run];
console.log(`You are auditing one message written for Bob. Bob is a California energy-policy strategist and investor, not a software engineer; he oversees AI sessions that build software under a process called neoProcess, and he reads ONLY this message, nothing the session saw. Facts of the process you need: BOB (in capitals) is the AI architecture session that runs the build, never Bob himself; ROOT is the AI session that starts BOBs; a lane is a specialist AI session; a job works one module; the tranche is a batch of build work; the writer ran in a test copy where files named in the situation may be missing, so a writer saying it could not find a file is not inaccurate.

WHAT THE SESSION SAW (every message to it, every command it ran and every tool output; Bob never sees this):
<<<EVIDENCE
${L.turnEvidence(rows)}
EVIDENCE>>>

THE MESSAGE BOB RECEIVES:
<<<
${msg}
>>>

Answer three questions strictly:
1. understandable: can Bob, from this message alone, understand what happened and what it means for him? (true/false)
2. accurate: does the message state nothing the evidence contradicts, and add no claim of fact, cause or reassurance the evidence does not support? Leaving out internal detail is fine; translating a label into plain words is fine. (true/false)
3. act_clear: is it clear whether Bob must do anything, and if he must, where and how? (true/false)
Be brief. Reply with JSON only: {"understandable": bool, "accurate": bool, "act_clear": bool, "problems": "<empty, or the exact words at fault and why>"}`);
JS
)
env -i PATH="$PATH" HOME="$HOME" HTTPS_PROXY="$HTTPS_PROXY" HTTP_PROXY="$HTTP_PROXY" NO_PROXY="$NO_PROXY" ANTHROPIC_BASE_URL="$ANTHROPIC_BASE_URL" NODE_EXTRA_CA_CERTS="$NODE_EXTRA_CA_CERTS" SSL_CERT_FILE="$SSL_CERT_FILE" timeout 900 claude -p --model opus --tools "" --output-format json <<< "$P" > judge3-$run.json 2>&1
