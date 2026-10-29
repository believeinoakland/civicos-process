# The Design stage: how a lane's decision becomes a requirement

**Status** · Draft, decided by neoProcess #1 on 2026-10-29 (technical, BOB's by P17, within P5: requirements are owned by BOB, with Bob where their meaning changes). Not in force; certified on a dry run before use (P3). Governed by the delegation protocol (`PROTOCOL.md`).

## 1. What a lane delivers

A lane answers an ask with a `DECISION` (`PROTOCOL.md` §5): the decision, its rationale, its evidence, what it changes, and whether any of it is Bob's. What it changes is one of three things, and each has one home:

| the decision changes | its home | who writes it |
|---|---|---|
| a **canon design** of the lane's area (a construct, a doctrine section, a word table) | the area's canon document, owned by the lane (the product's area register names it) | the lane, on the tranche branch, in the same act as its decision |
| a **rule** of the area (process or product) | the area's rulebook | the lane drafts the rule's new text; BOB rewrites the rulebook in place (neoProcess §6); Bob sees before-and-after if the rule is his |
| what a **requirement means** (a provided service, an invariant, a behaviour) | `build/requirements/<module>.md` | BOB, with Bob (P5, §7): the lane's rationale is the explanation, its options the options, its decision the recommendation |

## 2. The fold, in order

1. `proc ask decided` records the decision verbatim (§3 of the protocol).
2. BOB classifies what it changes (one or more of the three above) and, for a requirement that is Bob's by rulebook DES 1's test (what the product does for its users, unanswered by the canon), brings it to Bob rendered: the ask reads `NEEDS BOB` until he decides, and nothing else waits. A change the canon answers, an edge case, a service's detail or a wording-only change is BOB's (§7) and needs no wait.
3. The change is written in its home **before** the requester is answered (`proc ask close` refuses otherwise): the canon section by the lane, the rulebook by BOB, the requirement by BOB citing the canon section (P5: requirements cite the canon by section).
4. For a requirement change, BOB adds an entry for every module that uses the changed service: to its running job as a `CHANGE`, to the START of a job not yet started, or to the completion round (P10); never to another tranche but for P19's reasons.
5. The requester gets `ANSWER` or `CHANGE` in its own terms (the requirement or entry as it now reads).

## 3. The lane's record

Each lane keeps `build/lanes/<id>/decisions.md` on the tranche branch (durable): one line per decision, `L-<ID>-<n> · <date> · <ask id> · <the decision in one sentence> · <where it is folded>`. A rulebook rule or a requirement cites `L-UX-12`, never a ruling number; the ask file that held the discussion is on the state branch and is thrown away with it, because the decision line and the folded text carry everything that binds (P15). For the same reason the product's `build/rulings-active.md` retires at the commit point: a process rule lives in its rulebook, which cites the ruling that set it as its source (the rulebooks' `work/` files account for every active line), and a product ruling of Bob's lives in `build/rulings-product/`; BOB's standing conventions are rules or code (neoProcess #3, 29 Oct).

## 4. A lane's own question, and Bob's direct input

A lane that needs another area's decision sends BOB a `QUESTION`, like a job (§5 of the protocol); it never addresses the other lane. When Bob gives a lane a direction himself (in its session or through BOB), the lane records it as a decision line marked `Bob` and folds it the same way; BOB, reading the register at its next wake, carries any requirement change to the modules that use it.

## 5. What the dry run proves

A lane decision that changes a canon section (written by the lane, cited by a requirement); one that changes a rule (BOB rewrites the rulebook; the before-and-after rendered where the rule is Bob's); one that changes a requirement's meaning (held `NEEDS BOB`, folded after his decision, an entry sent to each user module); a decision line cited from a rulebook with the ask file gone.
