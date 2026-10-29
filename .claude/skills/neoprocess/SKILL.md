---
name: neoprocess
description: "neoProcess: invoke at the start of every session with your role as the argument (bob, job or lane), before anything else."
hooks:
  PreToolUse:
    - hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR:-.}/tools/hooks.mjs" pre'
  Stop:
    - hooks:
        - type: command
          command: 'node "${CLAUDE_PROJECT_DIR:-.}/tools/hooks.mjs" stop'
---
!`node "${CLAUDE_PROJECT_DIR:-.}/tools/proc.mjs" reading --role "$ARGUMENTS" --product "${CLAUDE_PROJECT_DIR:-.}" || echo "STOP: the process repository is not at ${CLAUDE_PROJECT_DIR:-.}, or the role is not bob, job or lane; attach it, then invoke this skill again with your role."`
