# REL · Release · a closed tranche reaches main, and a release is cut from it

In force from 2026-10-29, certified on N1. At most ten rules, one screen, each checkable. Tags: YOURS (Bob's policy) or BOB'S; CODE names what enforces it, TEXT means nothing does.

1. `main` reaches the tranche's commit only by the one close pull request, merged with the GitHub merge tool once the plan reads CLOSING; no other push or merge touches `main` while a tranche runs. (P12) BOB'S · CODE: BOB's hook allows the merge only at CLOSING and refuses any push to `main`.
2. The close first merges `main` into the tranche branch (never a rebase), merging in the design stream's pull request if it asked, and archives the plan with each entry's outcome and the tranche's measured usage. (P12, P14) BOB'S · CODE: `proc` writes the archive; the hook in rule 1.
3. The close runs the checks and the tests of the modules changed since their last tested merge and of their users, never every module's; a red not accepted by name blocks the close pull request. (Bob, K5339; P11) YOURS · TEXT.
4. The full regression runs only at a release or when Bob asks. (P11; Bob, K19) YOURS · TEXT.
5. A release is cut only when its deployment or measurement lets held work into the next tranche, at most one per boundary, and never mid-tranche from unmerged work. (P19; K1876) BOB'S · TEXT.
6. A release is cut on a branch from the open tranche branch, named by the product's release procedure (`build/situations/release.md`), and every change it makes to product files is merged into the tranche branch at once, an earlier unmerged cut included; it reaches `main` only through rule 1. (P12; Bob, K2273; K3217) BOB'S · TEXT.
7. A red the regression finds is fixed on the cut or accepted by name with the entry that clears it; none is left unnamed. (P7, P19; K3044) BOB'S · TEXT.
8. The release report is a file in the product's build state and states: the cut's commit and the tranche commit it came from, the version at every site, the regression result with each red named, and the rollback target of each deployed part. (P20; K3217, K2910) BOB'S · TEXT.
9. Every act of a release is BOB's without asking Bob, but the acts the product's release procedure names as his (K5346, the later of K5293 and K5346, governs); a refused act is never worked around, and a tag push refused by the proxy is never retried. (Bob, K5346, K4841; P17) YOURS · TEXT.
10. The tranche report to Bob states elapsed time, work finished, each entry deferred with its P19 reason, work left, cost and footprint; the next tranche opens at once. (P14, P19) BOB'S · CODE: `proc footprint` gives the footprint; TEXT otherwise.
