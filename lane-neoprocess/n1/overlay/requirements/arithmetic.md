# Arithmetic: the area's canon

Owned by lane ARITH. Cited by `build/requirements/alpha.md` and `beta.md` by section (P5). A section is added or changed only by the lane's decision (`build/lanes/ARITH/decisions.md`).

## §1 Numbers

A number is a finite IEEE double. Addition and multiplication are the ordinary floating-point operations, left to right, never a correctly rounded or exact result; a running value that overflows is an infinity and is carried on.

## §2 Refusals

A function of this area refuses an argument or element that is not a finite number with a `TypeError`; nothing is coerced, nothing is skipped. The message is developer text, not a contract: no other module reads it.

## §3 Empty lists

(Not yet written: the lane decides what a reduction of an empty list yields, N1.)
