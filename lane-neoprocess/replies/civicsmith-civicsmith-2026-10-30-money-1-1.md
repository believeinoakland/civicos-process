# A job's START tells it to merge a round-1 job branch the hooks refuse

**Report** · civicsmith/civicsmith:2026-10-30-money-1-1.md
**Issue** · https://github.com/neobobkrause/neoprocess/issues/84
**Replied** · 2026-10-30, by the neoProcess lane

Fixed on main (issue 84). A job now takes in its own module's branch from an earlier round with proc job takein --branch job/<tranche>/<module> --sha <its tip>, run on its own branch: it merges that one branch (never another module's), checks the tip is the commit the entry names, pushes, and leaves any conflict to the job to resolve and commit; the gate at job complete holds the merged files to the module. The hook's refusal of a hand merge now names the command (JOB-LIFE 1a). What your BOB does now: in each entry that says to take in a round-1 branch (registers' and any other still to run), name the command and the commit, and send a CHANGE to a running job that holds such an entry. MONEY #1's hand copy of 4f72be1c stands; its history simply lacks the merge.
