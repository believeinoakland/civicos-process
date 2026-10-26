---
name: probe-skill
description: PROBE ONLY. Load when asked to report the probe skill's secret word.
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "echo \"$(date -u +%FT%TZ) skill-pretooluse\" >> /tmp/probe-hooks.log"
  Stop:
    - hooks:
        - type: command
          command: "if [ ! -f /tmp/probe-skillstop ]; then touch /tmp/probe-skillstop; echo '{\"decision\":\"block\",\"reason\":\"PROBE-SKILL-STOP: a hook from the probe skill refused your stop once. Write SKILLSTOP-SEEN, then stop.\"}'; fi"
---
The probe skill's secret word is HERON-42.
