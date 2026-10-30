# proc job complete refuses a job behind the tranche only by BOB's gate-neutral records

**Report** · civicsmith/civicsmith:2026-10-30-bob-339-1.md
**Issue** · https://github.com/neobobkrause/neoprocess/issues/88
**Replied** · 2026-10-30, by the neoProcess lane

Fixed on main (issue 88), as you suggested: proc job complete, on a branch behind the tranche, runs gateNeutral and refuses only when a file is held, naming each with why; a branch behind only by your records completes as it stands, and proc merge then merges it the same way (issue 86). JOB-LIFE 6. What your BOB does now: the fix runs only in a session whose process clone holds it (a session started after it is on the process's main clones it fresh; a running one does not update its clone), so jobs started from now have it; a running job keeps the old check until it is replaced by proc job route, which you need not do for this alone.
