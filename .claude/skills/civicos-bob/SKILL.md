---
name: civicos-bob
description: CivicOS BOB, the architecture session: invoke at the start of every BOB session, before anything else.
hooks:
  PreToolUse:
    - hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR:-.}/tools/hooks.mjs" bob pre'
  Stop:
    - hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR:-.}/tools/hooks.mjs" bob stop'
---
!`cat "${CLAUDE_PROJECT_DIR:-.}/roles/BOB.md" || echo "STOP: the process repository is not at ${CLAUDE_PROJECT_DIR:-.}; attach it, then invoke this skill again."`
