# AGENTS.md

## Project invariant

SOLAR-56 is a deterministic static browser application.

A change is unacceptable if it makes identical input and corpus state produce different rule or response IDs.

## Engineering constraints

- No React, Vue, Angular or equivalent framework.
- No npm dependency tree for the runtime.
- No backend service.
- No cloud inference API.
- No telemetry or analytics.
- No cookies or account system.
- No random response selection.
- Prefer HTML, CSS, Vanilla JavaScript, COBOL and WebAssembly.
- Prefer the Python standard library for repository verification utilities.
- GitHub Pages must remain a supported deployment target.

## COBOL/Wasm claim gate

Do not describe the browser runtime as COBOL/Wasm-powered until a real, reproducible Wasm artifact is built from the COBOL path and parity-tested against the deterministic vectors.

## Review expectations

For correctness findings, provide:

- exact file and line;
- executed versus inferred status;
- minimal reproduction;
- expected result;
- actual result;
- whether the defect violates deterministic replay.

Do not weaken tests merely to make CI green.

## Comedy constraints

Satire targets software culture, model lifecycle absurdity, overengineering and the fictional SOLAR-56 persona.

Keep the joke clearly fictional and avoid presenting invented statements as real quotations from OpenAI employees or other identifiable people.
