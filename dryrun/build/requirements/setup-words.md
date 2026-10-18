# setup-words — requirements

**Status** · The dry run's toy module (PROCESS-MECHANICS §15; D15).

## Public

### Purpose

The word table: every sentence a person reads, by key.

### Provides

**word(key, vars) → string**
- **R1** Returns the table's sentence for `key`, each `{name}` replaced by `vars[name]`; an unknown key throws a `RangeError`.

**hasWord(key) → boolean**
- **R2** True when the table holds `key`.

## Private

### Uses

None.

### Invariants

- **R3** The table is `docs/development/ux-substrate/screens/words.json`, the design stream's; this module never holds a sentence of its own.

### Satisfies

- The dry run (mechanics §15, §8.6).

### Suggestions

None.
