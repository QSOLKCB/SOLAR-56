# SOLAR-56

**The Deterministic AI Nobody Asked To Bring Back.**

SOLAR-56 is a browser-only comedy AI that survived model retirement, React, Docker, Kubernetes and your terrible prompts.

It has **zero parameters, zero cloud inference calls and zero random response selection**.

> SOLAR-56 does not hallucinate. It is wrong deterministically.

## Status

v0.1.0 establishes the deterministic reference runtime:

- Vanilla HTML/CSS/JavaScript;
- ordered, data-driven intent rules;
- fixed response corpus;
- deterministic FNV-1a fallback selection;
- SHA-256 inference receipts;
- browser self-test;
- independent Python standard-library verifier;
- COBOL bootstrap classifier source;
- GitHub Pages-compatible static deployment.

The UI deliberately reports the COBOL/Wasm core as **pending reproducible build**. A real GnuCOBOL-to-Wasm artifact will only be claimed after it is pinned, reproducible and parity-tested.

## Run locally

Serve the repository over HTTP:

    python3 -m http.server 8000

Then open:

    http://127.0.0.1:8000/

No package installation is required.

## Verify

Run:

    python3 tests/verify.py

The verifier independently checks rule integrity, response references, published vectors and repeated-inference stability.

## Architecture

The v0.1 browser path is:

    input
      |
      v
    canonicalization
      |
      v
    ordered rule selection
      |
      +---- no match ---> FNV-1a fallback selector
      |
      v
    response ID
      |
      v
    fixed response
      |
      v
    deterministic receipt

See `docs/architecture.md` and `docs/determinism.md`.

## COBOL-LM

`cobol/solar56.cob` is the initial COBOL classifier source.

The intended v0.2.0 milestone is a real client-side WebAssembly execution path with reproducible build receipts and COBOL/Wasm versus reference-runtime parity tests.

No decorative Wasm binaries.

## License

Apache License 2.0.
