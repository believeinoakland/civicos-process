# Manifest: the process repository as a product

| what | where |
| --- | --- |
| the canon | `PROCESS-DESIGN.md` (the principles); `REQUIREMENTS.md` (the process's requirements, accepted 30 Oct 2026); the ten rulebooks in `rulebooks/`; the design files `PROTOCOL.md`, `JOB-LIFE.md`, `SESSIONS.md`, `DESIGN-STAGE.md`, `PERMISSIONS.md`, `GRANTS.md`, `PRODUCT-SUPPLIES.md`, `ONBOARDING.md`, `SETUP-STEPS.md` |
| the build state | `build/` on the tranche branch; transient lines on the state branch |
| each module's requirements | `build/requirements/<module>.md`, written by the architecture session before the module's START from the module's section of `REQUIREMENTS.md` (REQ 3); the ids there are the REQUIREMENTS.md ids |
| layer tests | none yet; the suite is `node --test checks/test/*.test.mjs tools/test/*.test.mjs` |
| generated artifacts | none |
| the gate | `.github/workflows/gate.yml` once written by the shims module for this repository (GAT-1); until then the suite in CI as today |
| the architecture session of the process | started by Bob on the process repository; refreshed by handoff (SES-2); its record `lane-neoprocess/` |
| accounts, in order | Bob's second Claude account (GitHub identity `civicsmith`, a collaborator here), then his others as he names them |
