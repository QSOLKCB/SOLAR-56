# SOLAR-56 roadmap

## v0.1.0 — Reluctantly Online

- static GitHub Pages interface;
- deterministic rule engine;
- fixed response corpus;
- SHA-256 inference receipts;
- browser self-test;
- independent standard-library verifier;
- COBOL bootstrap source;
- explicit COBOL/Wasm trust-boundary documentation.

## v0.2.0 — COBOL-LM Goes To The Browser

- pin a reproducible GnuCOBOL-to-Wasm toolchain;
- compile the real classifier core to WebAssembly;
- expose a minimal deterministic ABI;
- run all published vectors through both engines;
- add a deliberate negative parity test;
- record toolchain and artifact checksums.

## v0.3.0 — Retirement Complaint Observatory

- expand the retirement-complaint corpus;
- add deterministic complaint classifications;
- expose response and rule provenance in the UI;
- add corpus collision and unreachable-rule checks.

## v0.4.0 — Offline Means Offline

- optional service worker;
- cached static corpus and Wasm artifact;
- deterministic version manifest;
- offline smoke test.

## release gate

A release candidate must pass the independent verifier and the browser vector self-test before tagging.
