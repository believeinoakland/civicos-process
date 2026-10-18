# The layers (dry run)

| layer | name | contract | modules |
| --- | --- | --- | --- |
| 1 | Arithmetic | Pure functions; no state. | setup-words, catalog, alpha, beta |
| 2 | Statistics | Pure functions over layer 1. | stats, legacy |

`legacy` sits after `stats`, the module extracted from it, so it may use it (mechanics §12.2; D4, BOB #42). It is layer 2's by position only; its contract is none.
`catalog` is the toy's check catalogue, a legacy module first in the order, as BIO's `legacy-checks` (D5).
