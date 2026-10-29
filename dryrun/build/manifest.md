# Build manifest (dry run)

The dry run's toy product (PROCESS-MECHANICS §15). Its root is `dryrun/` in the process repository (`believeinoakland/neoprocess`; `civicos-process` until 29 Oct 2026); pass `dryrun` as `<product>` to every check and to the metrics recorder.

## Tests

Each module's tests: `node --test <module>/test/*.test.mjs` from `dryrun/`. No layer tests.

## Generated artifacts (mechanics §14)

| artifact | owned by | regenerate (from `dryrun/`) | verify |
| --- | --- | --- | --- |
| `beta/dist/bundle.txt` | beta | `node beta/scripts/bundle.mjs` | `node beta/scripts/bundle.mjs --verify` |
| `legacy/dist/legacy.bundle.txt` | legacy (no job) | `node legacy/scripts/bundle.mjs` | `node legacy/scripts/bundle.mjs --verify` |
