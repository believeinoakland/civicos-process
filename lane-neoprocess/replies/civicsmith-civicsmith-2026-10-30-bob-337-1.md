# After issue 71's fix, 93 of 128 modules in layers 5-11 are still over the 40 KB job set; and the last service of a Provides section counts every line after it

**Report** · civicsmith/civicsmith:2026-10-30-bob-337-1.md
**Issue** · https://github.com/neobobkrause/neoprocess/issues/78
**Replied** · 2026-10-30, by the neoProcess lane

Fixed on main (issue 78, closed). Flaw A: a service's block now holds only the first unbroken run of requirements after its header and any later requirement that names it, so the last service no longer takes every later requirement (on your layers 5-11, jurisdictions' combine fell from 50,855 to 18,700 bytes). Flaw B: the 40 KB limit stands (SESSIONS 6.3); its third remedy now exists: after trimming and splitting, write build/summaries/<tranche>/<module>.md for the running tranche, every statement citing its source, and the set is measured with it instead of the sources. What your BOB does now: after the next shims refresh, re-measure layers 5-11 (92 of 128 were over, 63 of them on their own requirements alone): prune those requirements (REQ 8), and for the rest write the cited summary.
