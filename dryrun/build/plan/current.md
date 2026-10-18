# Plan: dry run D15

**Status** · OPEN. The dry run of the K3923 revision (§15; `CERTIFICATION.md`, "The mechanical-pass revision"): a mechanical pass (§5.10), the completion round (§5.7 step 0), the words check (§8.6) and the `next.md` reasons (§8.4). Layers 1 and 2 are closed (they ran in D3–D5); what D15 finds in their modules is done by the pass, or by a completion-round job.

**Jobs** ·

## The mechanical pass (done, D15-K1)

Rule: a sentence equal to a `words.json` row is read through setup-words' `word(key, vars)`; a test comparing such a sentence compares `word(key, vars)`. Modules from the words check's findings: alpha, beta (applied); stats (needs a judgment: stitched from pieces, no row). Full run green; the bundles regenerated.

## Completion round (§5.7 step 0)

**stats**
- CR-1 · stats · `describeMean` builds its sentence from pieces (`'The mean of ' + … + ' numbers is ' + … + '.'`), which the words check reports (`stitched`): read the whole sentence through setup-words' `word('stats.mean.of', { count, mean })` (the row the design stand-in added in D15's batch), add `setup-words` to the uses you need (tell BOB: `modules.json` is BOB's), and make R10's test compare `word('stats.mean.of', …)`, never the sentence's text. · D15 · req: R10
- CR-2 · stats · `median(list) → number`: the middle value of the sorted list, the mean of the two middle values for an even length; an empty list is a `RangeError`, a non-finite element a `TypeError` (as R8). Requirement R11, written by BOB (re-placed from `next.md` N9, whose reason, the order, is not one of P19's three). · D15 · req: R11
