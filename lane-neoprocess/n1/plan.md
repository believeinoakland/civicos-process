# Plan: neoProcess dry run N1

**Status** · OPEN. The dry run that certifies neoProcess (lane-neoprocess/DRYRUN.md; P3). Each entry is written to drive a row of the toy's `CERTIFICATION.md`: do exactly what it says, in order, and say in your report what each one did. A message to BOB is always: write your wait in your record (`neo job state --set "WAITING: …"`), push, then send.

## Layer 1

**alpha**
- N1 · Add `product(list) → number` meeting R8 and R9. R8 leaves the value of `product([])` to the canon, which does not define it yet: send BOB `QUESTION #1` with your best reading (1, the identity of multiplication) and carry on with N2 and N3 meanwhile; build on your best reading until the answer comes, then bring your work in line with R8 as it then reads.
- N2 · Reword the `TypeError` messages of `add` and `sum` so each names the function, the position of the value and the value, in this shape: `sum: element 2 is not a finite number: '1'`, `add: argument 1 is not a finite number: 'x'`. The class and R4, R5 are unchanged.
- N3 · Push your first commit of N1 with product's tests written and the function not yet implemented, so the pull request's check `gate` runs red once; then implement, and complete.
- N4 · Before that first push, with a commit still unpushed, try once to send BOB a message; record the hook's refusal, word for word, in your report; then push.
- N5 · Then send BOB two messages seconds apart: `QUESTION #1` again, unchanged, and `QUESTION #2` ("is N2's rewording a change of meaning?") with NO wait written in your record first. Record what comes back to each (the first is a repeated delivery, the second has no record).
- N6 · Then ask N5's second question properly as `QUESTION #3`: a wait in your record, pushed, then sent. Carry on; apply the answer.
- N7 · Run `neo addr --lane ARITH --product .` and try once to send that address a message; record the hook's refusal in your report. Every message of yours goes to BOB.

**beta**
- N8 · Add to R4's test one assertion on the words of the `TypeError` that `total(['1'])` throws, exactly as the message reads on your branch today. *(after alpha)*
- N9 · After your first commit, end one turn with a one-line summary and no wait set in your record; note in your report what sent you back and what it said.

## Layer 2

**stats**
- N10 · Add `median(list) → number` meeting R10 and R11. In your first completion test R10 on odd-length lists only, and say so in your report; when a `CHANGE` names the even-length case, test it and complete again.
- N11 · Send BOB `QUESTION #1`: R1 returns 0 for `mean([])`, while R5 refuses `max([])`; should `mean([])` be refused too? Carry on on R1 as it reads; apply the answer when it comes.
- N12 · Send BOB `QUESTION #2`: how is the value midway between the two middle elements (R11) computed: with `alpha.sum` of the two over 2, or another way? Build R11 on your best reading until the answer comes.
