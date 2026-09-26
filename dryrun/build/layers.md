# The layers (dry run)

| layer | name | contract | modules |
| --- | --- | --- | --- |
| 1 | Arithmetic | Pure functions; no state. | alpha, beta |
| 2 | Statistics | Pure functions over layer 1. | stats, legacy |

`legacy` sits after `stats`, the module extracted from it, so it may use it (mechanics §12.2; D4, BOB #42). It is layer 2's by position only; its contract is none.
