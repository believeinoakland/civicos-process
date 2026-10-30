---
name: neoprocess
description: "neoProcess: invoke at the start of every session with your role as the argument (bob, job, lane or root; process for the neoProcess lane that maintains the process repository; onboard to bring a project under the process), before anything else."
---
!`node "${CLAUDE_SKILL_DIR}/../../../tools/proc.mjs" reading --role "$ARGUMENTS" --product "${CLAUDE_SKILL_DIR}/../../.." || echo "STOP: the process repository is not at ${CLAUDE_SKILL_DIR}/../../.., or the role is not bob, job, lane, root, process or onboard; attach it, then invoke this skill again with your role."`
