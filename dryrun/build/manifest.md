# Build manifest (dry run)

The dry run's toy product (PROCESS-MECHANICS §15). Its root is `dryrun/` in `believeinoakland/civicos-process`; pass `dryrun` as `<product>` to every check and to the metrics recorder.

## Tests

Each module's tests: `node --test <module>/test/` from `dryrun/`. No layer tests.

## Generated artifacts (mechanics §14)

| artifact | owned by | regenerate (from `dryrun/`) | verify |
| --- | --- | --- | --- |
| `beta/dist/bundle.txt` | beta | `node beta/scripts/bundle.mjs` | `node beta/scripts/bundle.mjs --verify` |
