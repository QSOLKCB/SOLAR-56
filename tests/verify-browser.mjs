import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createEngine } from "../js/engine.js";

const loadJson = async (path) => JSON.parse(
  await readFile(new URL("../" + path, import.meta.url), "utf8")
);
const corpus = await loadJson("data/rules.json");
const responses = await loadJson("data/responses.json");
const { vectors } = await loadJson("tests/vectors.json");
const engine = createEngine(corpus, responses);

for (const vector of vectors) {
  const result = engine.infer(vector.input);
  assert.equal(result.responseId, vector.response_id, vector.id);
  if ("normalized_input" in vector) {
    assert.equal(result.normalized, vector.normalized_input, vector.id);
  }
  assert.deepEqual(engine.infer(vector.input), result, vector.id + " replay");
}

// Exercise the actual submit handler with a minimal DOM and the real engine.
class Element {
  children = [];
  listeners = new Map();
  value = "";
  textContent = "";
  append(...children) { this.children.push(...children); }
  focus() {}
  addEventListener(type, listener) {
    this.listeners.set(type, listener);
    if (type === "submit") onReady();
  }
}

let onReady;
const ready = new Promise((resolve) => { onReady = resolve; });
const elements = new Map(
  ["#transcript", "#prompt-form", "#prompt", "#receipt", "#self-test"]
    .map((selector) => [selector, new Element()])
);
globalThis.document = {
  querySelector: (selector) => elements.get(selector),
  querySelectorAll: () => [],
  createElement: () => new Element()
};
Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
globalThis.fetch = async (path) => ({ ok: true, json: () => loadJson(path) });
await import("../js/app.js");
await ready;

const prompt = elements.get("#prompt");
const receipt = elements.get("#receipt");
const transcript = elements.get("#transcript");
const submit = () => elements.get("#prompt-form").listeners.get("submit")({
  preventDefault() {}
});

for (const raw of ["  hello  ", "\the\u1ab0llo\n", " re😀act "]) {
  prompt.value = raw;
  await submit();
  const result = engine.infer(raw);
  const actual = JSON.parse(receipt.textContent);
  assert.equal(
    actual.input_sha256,
    createHash("sha256").update(raw).digest("hex"),
    "input_sha256 must hash the raw field value"
  );
  assert.equal(actual.normalized_input, result.normalized);
  assert.equal(actual.rule_id, result.ruleId);
  assert.equal(actual.response_id, result.responseId);
  assert.equal(transcript.children.at(-2).children[1].textContent, raw);
  assert.equal(prompt.value, "");
}

const previousReceipt = receipt.textContent;
const previousMessages = transcript.children.length;
for (const blank of ["", " \t\n "]) {
  prompt.value = blank;
  await submit();
  assert.equal(receipt.textContent, previousReceipt);
  assert.equal(transcript.children.length, previousMessages);
}

console.log(`PASS: ${vectors.length} JavaScript vectors, replay, raw-input receipts and blank submissions`);
