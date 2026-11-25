# Wasm status

No WebAssembly binary is committed in v0.1.0.

That is intentional.

SOLAR-56 will not ship a decorative `.wasm` file or claim that COBOL is executing in the browser until the build is reproducible and independently checked.

The intended next phase is:

1. pin GnuCOBOL and the browser-capable Wasm toolchain;
2. compile a COBOL classifier entry point;
3. record exact tool versions and artifact SHA-256;
4. load the resulting module from Vanilla JavaScript;
5. execute the published vectors through both paths;
6. fail CI on any COBOL/Wasm versus reference-runtime divergence.

Until then, `cobol/solar56.cob` is source material and the JavaScript engine is the executable reference implementation.
