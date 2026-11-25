# SOLAR-56 architecture

SOLAR-56 is a static, deterministic browser application. It is deliberately not an LLM and does not pretend to be one.

## v0.1.0 execution path

1. The browser loads static HTML, CSS and JavaScript from the same origin.
2. The runtime loads `data/rules.json` and `data/responses.json`.
3. User input is canonicalized with a fixed normalization contract.
4. Rules are evaluated in file order. The first match wins.
5. If no rule matches, FNV-1a 32-bit selects one response from a fixed fallback set.
6. The UI emits the response plus an inference receipt.
7. The receipt contains the raw-input SHA-256, normalized input, rule ID and response ID.
8. No timestamp is included because a clock would make otherwise identical receipts differ.

For the same corpus and the same input, the selected rule and response are invariant.

## Trust boundary

The v0.1 browser runtime is the executable reference implementation.

`cobol/solar56.cob` is an intentionally small COBOL bootstrap oracle for the core joke paths. It is not yet claimed to be the browser execution engine.

The project must not advertise a COBOL/Wasm execution path until all of these gates are met:

- GnuCOBOL and the Wasm toolchain are pinned and documented.
- the resulting `.wasm` artifact is reproducibly built;
- the artifact checksum is recorded;
- browser inference uses the Wasm export rather than a decorative binary;
- COBOL/Wasm and the independent verifier agree on the published vectors;
- a negative parity test proves the gate can fail.

## Runtime constraints

SOLAR-56 has no runtime backend, package manager, framework, database, telemetry pipeline or third-party API.

Same-origin fetches for the static corpus and test vectors are the only network activity performed by the application when hosted on GitHub Pages.
