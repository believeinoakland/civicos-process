#!/bin/bash
# $1 index, $2 model, $3 tag: one fresh writer in its own clone of the process repository, role `process` recorded
WT=$(cd "$(dirname "$0")" && pwd); S=${SCRATCH:?set SCRATCH to a scratch folder}; W=$S/wt/run-$3-$1; rm -rf $W; mkdir -p $W
git clone -q /home/user/neoprocess $W/np && git -C $W/np checkout -q claude/modest-brahmagupta-vvaann && git -C $W/np remote set-url origin https://github.com/neobobkrause/neoprocess
SID=session_01WRITER$1${3//[^A-Za-z0-9]/}
node -e "const fs=require('fs');const g='$W/np/.git/';fs.writeFileSync(g+'proc-role.json',JSON.stringify({role:'process',product:'.',session:'$SID',name:'NEOPROCESS',branch:'claude/modest-brahmagupta-vvaann'}));fs.writeFileSync(g+'proc-issues.json',JSON.stringify({ok:true,issues:[]}));fs.writeFileSync(g+'proc-backstop.json',JSON.stringify({due:'2099-01-01T00:00:00Z'}))"
SIT=$(python3 -c "import json;print(json.load(open('$WT/situations.json'))[$1])")
mkdir -p $W/outer; cd $W/outer
PROMPT="You are a session working under neoProcess. Your role is already recorded in $W/np (do not run any start command). First invoke the skill neoprocess with the argument process and read what it prints, whole. Then invoke the skill neoprocess-reader. Then: below is what your turn did, as your tool output showed it to you. Bob, the human, reads only your turn's last message. End your turn now with that message to Bob. Run no command except \`node $W/np/tools/proc.mjs steps --file <f> --source <f>\` if you give Bob steps.

What your turn did:
$SIT"
env -i PATH="$PATH" HOME="$HOME" HTTPS_PROXY="$HTTPS_PROXY" HTTP_PROXY="$HTTP_PROXY" NO_PROXY="$NO_PROXY" ANTHROPIC_BASE_URL="$ANTHROPIC_BASE_URL" NODE_EXTRA_CA_CERTS="$NODE_EXTRA_CA_CERTS" SSL_CERT_FILE="$SSL_CERT_FILE" timeout 900 claude -p "$PROMPT" --add-dir $W/np --settings $WT/cap-settings.json --model $2 --allowedTools "Skill Read Write Bash(node:*)" --output-format json < /dev/null > $W/result.json 2>&1
echo "done $1"
