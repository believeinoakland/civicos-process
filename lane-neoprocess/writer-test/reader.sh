#!/bin/bash
# $1 model, $2 index ; reads corpus.json, writes out/<model>-<i>.json
WT=$(cd "$(dirname "$0")" && pwd); S=${SCRATCH:?set SCRATCH to a scratch folder}; mkdir -p $S/wt $S/cal
cd $S/cal
p=$(python3 - "$2" <<'PY'
import json,sys
c=json.load(open('corpus.json'))[int(sys.argv[1])]
args=json.dumps({"session_id":"x","transcript_path":"/x","cwd":"/x","hook_event_name":"Stop","stop_hook_active":False,"last_assistant_message":c[1]})
print(open('../reader-prompt.txt').read().replace('$ARGUMENTS',args))
PY
)
mkdir -p out
env -i PATH="$PATH" HOME="$HOME" HTTPS_PROXY="$HTTPS_PROXY" HTTP_PROXY="$HTTP_PROXY" NO_PROXY="$NO_PROXY" ANTHROPIC_BASE_URL="$ANTHROPIC_BASE_URL" NODE_EXTRA_CA_CERTS="$NODE_EXTRA_CA_CERTS" SSL_CERT_FILE="$SSL_CERT_FILE" timeout 180 claude -p "$p" --model "$1" --tools "" --output-format json < /dev/null > out/$1-$2${3:+-$3}.json 2>&1
