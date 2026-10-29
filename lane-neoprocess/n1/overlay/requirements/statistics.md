# Statistics: the area's canon

Owned by lane STATISTICS. Cited by `build/requirements/stats.md` by section (P5). A section is added or changed only by the lane's decision (`build/lanes/STATISTICS/decisions.md`).

## §1 Statistics of a list

A statistic is a pure function of a list of numbers (Arithmetic §1), computed with the Arithmetic area's operations, so its rounding is theirs.

## §2 Refusals

A statistic that has no value for an empty list refuses it with a `RangeError`; an element that is not a finite number is refused as Arithmetic §2 refuses it, the empty list judged first.

## §3 The midpoint of two numbers

(Not yet written: the lane decides how the value midway between two numbers is computed, N1.)
