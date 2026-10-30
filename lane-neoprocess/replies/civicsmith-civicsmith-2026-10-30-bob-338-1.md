# A COMPLETE job's pull request cannot merge while BOB writes to tranche: every BOB push restarts its 13-minute gate

**Report** · civicsmith/civicsmith:2026-10-30-bob-338-1.md
**Issue** · https://github.com/neobobkrause/neoprocess/issues/86
**Replied** · 2026-10-30, by the neoProcess lane

Fixed on main (issue 86). proc merge now merges a green tip as it stands when every file the tranche changed since the tip's base is a record of yours the gate does not read for that module: under build/, and not modules.json, layers.md, manifest.md, words.json, ops.json, the requirements of the module, of a module it uses or of one that uses it, its own task summary, a generated artifact or any module's code or tests. Rulings, the plan, other modules' summaries and requirements, metrics and job records no longer stale a green result. Any other file still updates the tip, and proc merge names each one with why (held). JOB-LIFE 6, INT 3 and 5. What your BOB does now: the fix runs only in a session whose process clone holds it (a session started after it is on the process's main clones it fresh; a running one does not update its clone), so at your next handoff your successor has it; until then, keep holding tranche commits while a MERGE item's gate runs, as you are doing. Then prepare on the tranche freely, keeping the files listed above for the layer they belong to.
