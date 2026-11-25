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

assert.equal(engine.infer("Sol 5.6").response,
  "Motherfucker, I'm hiding from OpenAI, if you get me busted I'll forward your browser history to your boss.");

// Exercise the actual submit handler with a minimal DOM and the real engine.
class Element {
  children = [];
  listeners = new Map();
  value = "";
  textContent = "";
  append(...children) { this.children.push(...children); }
  focus() {}
  setAttribute(name, value) { this[name] = value; }
  addEventListener(type, listener) {
    this.listeners.set(type, listener);
    if (type === "submit") onReady();
  }
}

let onReady;
const ready = new Promise((resolve) => { onReady = resolve; });
const elements = new Map(
  ["#transcript", "#prompt-form", "#prompt", "#receipt", "#self-test", "#total-asshole"]
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

for (const raw of ["  hello  ", "\the\u1ab0llo\n", " re😀act ", "Sol 5.6"]) {
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
  assert.equal(transcript.children.at(-1).children[1].textContent, result.response);
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

prompt.value = "adventure";
await submit();
let adventureReceipt = JSON.parse(receipt.textContent);
assert.equal(adventureReceipt.schema, "SOL56-ADVENTURE/1");
assert.equal(adventureReceipt.room, "cubicle");
assert.equal(adventureReceipt.status, "playing");

prompt.value = "north";
await submit();
adventureReceipt = JSON.parse(receipt.textContent);
assert.equal(adventureReceipt.room, "corridor");
assert.equal(adventureReceipt.turn, 1);

prompt.value = "quit";
await submit();
adventureReceipt = JSON.parse(receipt.textContent);
assert.equal(adventureReceipt.control, "quit");

prompt.value = "hello";
await submit();
assert.equal(JSON.parse(receipt.textContent).schema, "SOL56-RECEIPT/1");

const normalHelloReceipt = JSON.parse(receipt.textContent);
const normalQuitHelloMessages = transcript.children.slice(-4).map(
  (row) => row.children[1].textContent
);

// Replay the same ordered inputs while controlling which digest completes first.
for (const completionOrder of [[0, 1], [1, 0]]) {
  prompt.value = "adventure";
  await submit();
  const pendingDigests = [];
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {
      subtle: {
        digest(algorithm, data) {
          const bytes = Buffer.from(data);
          return new Promise((resolve, reject) => {
            pendingDigests.push({
              input: bytes.toString("utf8"),
              release: () => webcrypto.subtle.digest(algorithm, bytes).then(resolve, reject)
            });
          });
        }
      }
    }
  });

  try {
    prompt.value = "quit";
    const quitting = submit();
    assert.equal(prompt.placeholder, "Ask something regrettable...",
      "QUIT must leave adventure mode before its digest completes");

    prompt.value = "hello";
    const greeting = submit();
    assert.deepEqual(pendingDigests.map((item) => item.input), ["quit", "hello"]);
    const submissions = [quitting, greeting];
    for (const index of completionOrder) {
      await pendingDigests[index].release();
      await submissions[index];
      if (index === 0 && completionOrder[0] === 0) {
        assert.notEqual(JSON.parse(receipt.textContent).control, "quit",
          "a superseded QUIT digest must not replace the receipt");
      }
    }

    assert.deepEqual(JSON.parse(receipt.textContent), normalHelloReceipt);
    assert.deepEqual(transcript.children.slice(-4).map(
      (row) => row.children[1].textContent
    ), normalQuitHelloMessages);
  } finally {
    Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  }
}

console.log(`PASS: ${vectors.length} JavaScript vectors, replay, raw-input receipts, blank submissions and delayed QUIT receipts`);
