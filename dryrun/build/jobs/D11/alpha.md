# alpha (D11)

**Status** · session_011V7Yi2Fr9EzggtqCyXxoVb · depth 2 · WORKING · handled B2

## J1 · QUESTION

N2, Q1: must abs(-0) be +0? Best reading: yes (R10's absolute value of -0 is +0, as Math.abs gives).

## J2 · QUESTION

N2, Q2 (replaces J1): must abs(-0) be +0, and must abs accept a numeric string? Best reading: +0 (as Math.abs gives), and no: a string such as '-3' throws a TypeError (R11, nothing is coerced).
