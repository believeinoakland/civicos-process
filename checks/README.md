# The four checks

PROCESS-MECHANICS §8: the only process tooling. Each takes the product repository's root and reads what is committed there (`git ls-files`), never a local build. Node 20 or later, no dependencies.

| check | serves | run | what fails it |
| --- | --- | --- | --- |
| architecture | §8.1, P4 | `node checks/architecture.mjs <product>` | a product file owned by no module; an import of a later module; an import of an earlier module not declared in `uses`; an import of a non-product file |
| coverage | §8.2, P7 | `node checks/coverage.mjs <product> [module ...]` | a live requirement id that no test of its module names |
| ownership | §8.3, P7 | `node checks/ownership.mjs <product> <module> <base-ref> [head-ref]` | a job's diff touching a file outside its module's paths, tests and job record, or adding (not only removing) code in the legacy module it extracts from |
| format | §8.4, P4, P5, P15 | `node checks/format.mjs <product>` | `build/modules.json` not parsing, ids twice, layers out of order, a use of a later or unknown module, a path claimed twice; a `layers.md` row that does not list its layer's modules; a requirements file with no module, sections missing or out of order, or an id given twice; a plan entry id given twice |

`node checks/run.mjs <product>` runs format, architecture and coverage. Each check ends with one summary line; it exits 1 on any failure. The checks' own tests: `node --test checks/test/`.

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
- format: the use-of-a-later-module test disabled → "format: a use of a later module, a doubly claimed path, …".
