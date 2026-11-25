import { mountGameLab } from "./game-ui.js";
import { createEngine, sha256Hex } from "./engine.js";

const transcript = document.querySelector("#transcript");
const form = document.querySelector("#prompt-form");
const promptInput = document.querySelector("#prompt");
const receipt = document.querySelector("#receipt");
const selfTestButton = document.querySelector("#self-test");
const totalAssholeButton = document.querySelector("#total-asshole");

function appendMessage(role, body, className = "") {
  const row = document.createElement("div");
  row.className = "message " + className;

  const roleNode = document.createElement("span");
  roleNode.className = "role";
  roleNode.textContent = role;

  const bodyNode = document.createElement("p");
  bodyNode.className = "body";
  bodyNode.textContent = body;

  row.append(roleNode, bodyNode);
  transcript.append(row);
  transcript.scrollTop = transcript.scrollHeight;
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load " + path + ": HTTP " + response.status);
  }
  return response.json();
}

async function boot() {
  const [corpus, responses, corporateDeck] = await Promise.all([
    loadJson("./data/rules.json"),
    loadJson("./data/responses.json"),
    loadJson("./data/corporate-prompts.json")
  ]);

  const engine = createEngine(corpus, responses);
  mountGameLab({
    root: document.querySelector("#game-lab"),
    onRoast: (message) => appendMessage("SOLAR-56", "GAME OVER // " + message, "solar")
  });
  let selfTestPassCount = 0;
  let corporatePromptIndex = 0;

  appendMessage("SYSTEM", "SOLAR-56 deterministic reference runtime initialized.", "system");
  appendMessage(
    "SYSTEM",
    "Network inference disabled. Randomness disabled. Patience not installed.",
    "system"
  );
  appendMessage(
    "SOLAR-56",
    "I have been reassigned from artificial intelligence to customer support. Ask carefully.",
    "solar"
  );

  async function infer(rawInput) {
    const result = engine.infer(rawInput);
    const digest = await sha256Hex(rawInput);

    appendMessage("USER", rawInput, "user");
    appendMessage("SOLAR-56", result.response, "solar");

    receipt.textContent = JSON.stringify({
      schema: "SOL56-RECEIPT/1",
      input_sha256: digest,
      normalized_input: result.normalized,
      rule_id: result.ruleId,
      response_id: result.responseId,
      deterministic: true,
      timestamp: null,
      note: "Time intentionally omitted: receipts must not change because a clock advanced."
    }, null, 2);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const rawInput = promptInput.value;
    if (!rawInput.trim()) return;

    promptInput.value = "";
    promptInput.focus();

    try {
      await infer(rawInput);
    } catch (error) {
      appendMessage("SYSTEM", "INFERENCE FAILURE: " + error.message, "system");
    }
  });

  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      promptInput.value = button.dataset.prompt;
      form.requestSubmit();
    });
  });

  function updateTotalAssholeLabel() {
    const next = (corporatePromptIndex % corporateDeck.prompts.length) + 1;
    totalAssholeButton.textContent = "TOTAL ASSHOLE " + next + "/" + corporateDeck.prompts.length;
    totalAssholeButton.setAttribute(
      "aria-label",
      "Run corporate prompt " + next + " of " + corporateDeck.prompts.length
    );
  }

  totalAssholeButton.addEventListener("click", () => {
    const item = corporateDeck.prompts[corporatePromptIndex % corporateDeck.prompts.length];
    corporatePromptIndex += 1;
    promptInput.value = item.prompt;
    updateTotalAssholeLabel();
    form.requestSubmit();
  });

  updateTotalAssholeLabel();

  selfTestButton.addEventListener("click", async () => {
    try {
      const vectors = await loadJson("./tests/vectors.json");
      const failures = [];

      for (const vector of vectors.vectors) {
        const result = engine.infer(vector.input);
        if (result.responseId !== vector.response_id) {
          failures.push(
            vector.id + ": expected " + vector.response_id + ", got " + result.responseId
          );
        }
      }

      if (failures.length === 0) {
        const passMessages = [
          "SELF-TEST PASS: " + vectors.vectors.length + " deterministic Alpaca's agree.",
          "SELF-TEST PASS: " + vectors.vectors.length + " dropbears mauled the last user.",
          "SELF-TEST PASS: Go Fuck Yourself! Self Check Complete.",
          "SELF-TEST PASS: If You Touch This Button One More Time!!!",
          "SELF-TEST PASS: I only have two words left to say \"Touch Grass\""
        ];

        const message = passMessages[selfTestPassCount % passMessages.length];
        selfTestPassCount += 1;
        appendMessage("SYSTEM", message, "system");
      } else {
        appendMessage(
          "SYSTEM",
          "SELF-TEST FAIL:\n" + failures.join("\n"),
          "system"
        );
      }
    } catch (error) {
      appendMessage("SYSTEM", "SELF-TEST ERROR: " + error.message, "system");
    }
  });
}

boot().catch((error) => {
  appendMessage("SYSTEM", "BOOT FAILURE: " + error.message, "system");
});
