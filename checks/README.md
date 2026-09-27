# The four checks

PROCESS-MECHANICS §8: the only process tooling. Each takes the product repository's root and reads what is committed there (`git ls-files`), never a local build. Node 20 or later, no dependencies.

| check | serves | run | what fails it |
| --- | --- | --- | --- |
| architecture | §8.1, P4 | `node checks/architecture.mjs <product> [module ...]` (a job names its own module) | a product file owned by no module; an import of a later module; an import of an earlier module not declared in `uses`; an import of a non-product file |
| coverage | §8.2, P7 | `node checks/coverage.mjs <product> [module ...]` | a live requirement id that no test of its module names |
| ownership | §8.3, P7 | `node checks/ownership.mjs <product> <module> <base-ref> [head-ref]` | a job's diff touching a file outside its module's paths, tests and job record; in the legacy module it extracts from, an added import of anything but its own paths, a block of added lines that uses nothing so imported, or a net addition (every added legacy line is printed `ADDED` for BOB's review; a changed line that only removes tokens from the line it replaces, such as a dropped key or import name, is a removal, printed `EDITED`, K140) |
| format | §8.4, P4, P5, P15 | `node checks/format.mjs <product>` | `build/modules.json` not parsing, ids twice, layers out of order, a use of a later or unknown module, a path claimed twice; a `layers.md` row that does not list its layer's modules; a requirements file with no module, sections missing or out of order, or an id given twice; a plan entry id given twice |

**Certification harness** (`checks/cert/`, `dryrun/cert/SUITE.md` §4; bio K164; not one of the four checks, a test tool for revising them and the mechanics):
- `node checks/cert/records.mjs [--strict] <file> ...` validates job records, the plan's Status line, handoffs, metrics CSVs and files of message first lines (`--message '<line>'` for one line); `--strict` requires the message id, version and reply-to the revised design adds (X3).
- `node checks/cert/assert.mjs <run.json> [product]` judges a run's scenarios from git, records, CSV and snapshots: `<id> PASS|FAIL|UNOBSERVED <reason>`, exit 1 on a FAIL or a required UNOBSERVED. Predicates so far: A4, A5, B2, D3, D4, D9, E1, G4, H6.

`node checks/run.mjs <product>` runs format, architecture and coverage. Each check ends with one summary line; it exits 1 on any failure. The checks' own tests: `node --test checks/test/*.test.mjs`.

## How the checks read the build state (BOB #38, 2026-09-26)

- **Owner.** A path ending in `/` owns everything under it; any other path owns that one file. When paths nest, the most specific owns the file (a legacy module's `bio-plane/test/` holds the extracted modules' `bio-plane/test/m/<module>/`). Two modules claiming the same path is a format failure. This is how "exactly one owner" (P4, mechanics §1) is read.
- **Not product.** `not_product` in `modules.json` lists the paths no module owns (docs, the build state, the old tooling, release output). An import of one of them from product code fails.
- **Imports.** Relative specifiers of `import`, `export … from`, `import()` and `require()` in `.mjs`, `.cjs`, `.js` and `.ts` files, with comments removed. Package imports are not judged. A relative import naming no tracked file is counted, not judged: it is fixture text more often than code, and a real one fails when loaded.
- **Requirement ids.** An id is defined where it is written in bold, `**Rn**`, anywhere on its line; a mention elsewhere is plain `Rn`. A line carrying `*(retired` marks its ids retired, and they need no test.
- **A test names an id** by writing it as a word (`R12`) in a file under its module's `tests` paths, conventionally in the test's title.

## Negative controls (2026-09-26)

Each check was broken on purpose, the named test failed, and the file was restored and verified by hash:
- architecture: every target treated as earlier → "architecture: an import of a later module fails".
- coverage: ids read only at the start of a line → "coverage: an id in bold after a signature is an id; a plain mention is not".
- ownership: additions to a legacy file allowed → "ownership: an extracting module may remove from its legacy module, never add".
- ownership (BOB #42): a block of added legacy lines that uses nothing of the module's own allowed → that test and "ownership: an extraction fails on an added import of another module, an unrelated addition, or a net addition".
- format: the use-of-a-later-module test disabled → "format: a use of a later module, a doubly claimed path, …".
- ownership (K164 harness, K140): the pairing of a changed line with the line it replaces removed (the pre-K140 check restored) → the four "K140" tests fail; on bio's real case (CONTENT #1, `886dfe3f13...9668390af1`) the old check fails on `store.mjs:778` and the new one passes, listing it `EDITED`.

## The protocol model (bio K164, `dryrun/cert/SUITE.md` §4.3)

`node checks/cert/model.mjs [--rules current|revised] [--set <bound set>] [--<bound> n ...]` explores the process protocol exhaustively (BFS) and prints, per invariant, PASS or the shortest counterexample; exit 1 on any violation. The engine is `model.mjs`; the rules are `rules-current.mjs` (the mechanics as written, each action citing its §) and `rules-revised.mjs` (the K164 revision; every property holds). Each rule set lists its bound sets; the default run explores all of them in under a minute. `--off <rule,…>` switches a revised rule off (negative controls only). Not one of the four checks: it certifies the mechanics, not a product.
