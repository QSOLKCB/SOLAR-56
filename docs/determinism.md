# Determinism contract

SOLAR-56 treats determinism as a public interface, not a marketing adjective.

## Canonicalization

Input is transformed by the following ordered operations:

1. Unicode NFKD decomposition.
2. Lowercase conversion.
3. Removal of combining marks.
4. Replacement of non-ASCII alphanumeric runs with one space.
5. Trimming.
6. Collapse of repeated whitespace.

The resulting string is the normalized input.

## Selection

Rules are ordered. Each rule can define:

- `exact`: normalized strings that must match exactly;
- `all`: every listed phrase must occur;
- `any`: at least one listed phrase must occur;
- `none`: no listed phrase may occur.

The first matching rule wins.

If no rule matches, FNV-1a 32-bit is computed over the normalized ASCII input and reduced modulo the number of fallback response IDs.

There is no random number generator.

## Receipts

The browser displays:

- receipt schema;
- SHA-256 of the raw input;
- normalized input;
- selected rule ID;
- selected response ID;
- deterministic flag.

The receipt intentionally contains no wall-clock time.

## Independent verification

`tests/verify.py` independently implements canonicalization, ordered rule matching and fallback selection using only the Python standard library.

It validates:

- schema presence;
- unique rule IDs;
- referential integrity between rules and responses;
- fallback integrity;
- published input/response vectors;
- repeated-inference stability.

The browser SELF-TEST executes the same published vectors against the JavaScript runtime.
