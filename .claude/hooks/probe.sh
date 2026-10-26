#!/bin/bash
# PROCESS-REDESIGN probe P1: does a repository hook run in a cloud session? Writes a marker; on Stop, blocks once.
ev="$1"; d="${CLAUDE_PROJECT_DIR:-.}"
echo "$(date -u +%FT%TZ) $ev" >> /tmp/probe-hooks.log
case "$ev" in
  start) echo "PROBE-SESSIONSTART-OK: this line came from a SessionStart hook in .claude/settings.json." ;;
  stop) if [ ! -f /tmp/probe-stop-blocked ]; then touch /tmp/probe-stop-blocked; echo '{"decision":"block","reason":"PROBE-STOP-BLOCK: a Stop hook refused your first stop. Write the word STOPHOOK-SEEN in your reply, then stop."}'; fi ;;
esac
exit 0
