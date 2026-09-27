K140 (bio `build/rulings.md`, BOB #45): CONTENT #1's extraction dropped the `staled` key from one return line of
`bio-plane/src/store.mjs` (line 778 at merge `77869ad095`); the ownership check read the changed line as an added one.
`legacy-before.mjs` and `legacy-after.mjs` are that listener, cut down to what the check reads: the moved stale mark,
the listener rewired to the extracted module, and the return line that only loses a key.
