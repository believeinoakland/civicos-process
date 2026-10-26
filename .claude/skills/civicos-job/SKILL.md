---
name: civicos-job
description: CivicOS module job: invoke at the start of every module job session, before anything else.
hooks:
  PreToolUse:
    - hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR:-.}/tools/hooks.mjs" job pre'
  Stop:
    - hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR:-.}/tools/hooks.mjs" job stop'
---
!`cat "${CLAUDE_PROJECT_DIR:-.}/roles/JOB.md" || echo "STOP: the process repository is not at ${CLAUDE_PROJECT_DIR:-.}; attach it, then invoke this skill again."`
