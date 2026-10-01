# civicos-process — read this first

This repository defines how CivicOS is built. It holds no product code. Read your role's instructions whole before anything else: `roles/BOB.md` (the architecture session), `roles/JOB.md` (a module job) or `roles/ROOT.md` (the session that starts every BOB). The principles (`PROCESS-DESIGN.md`) and the mechanics (`PROCESS-MECHANICS.md`) govern both; a principle changes only with Bob's approval, and principle P17 sets the working relationship with Bob at all times. The product is `believeinoakland/bio`; its `build/manifest.md` says where its build state lives.

Changes here are process changes (P3): checked against the principles, and proven on a small dry-run tranche before product work relies on them. The checks' own tests: `node --test checks/test/*.test.mjs tools/test/*.test.mjs`.
