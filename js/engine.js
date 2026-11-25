export function canonicalize(input) {
  return String(input ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function fnv1a32(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function ruleMatches(text, rule) {
  if (Array.isArray(rule.exact) && rule.exact.length > 0 && !rule.exact.includes(text)) {
    return false;
  }

  const all = rule.all ?? [];
  const any = rule.any ?? [];
  const none = rule.none ?? [];

  if (!all.every((phrase) => text.includes(phrase))) return false;
  if (any.length > 0 && !any.some((phrase) => text.includes(phrase))) return false;
  if (none.some((phrase) => text.includes(phrase))) return false;
  return true;
}

export function selectResponse(normalized, corpus) {
  for (const rule of corpus.rules) {
    if (ruleMatches(normalized, rule)) {
      return { ruleId: rule.id, responseId: rule.response };
    }
  }

  const index = fnv1a32(normalized) % corpus.fallbacks.length;
  return {
    ruleId: "SOL56-RULE-FALLBACK-FNV1A32",
    responseId: corpus.fallbacks[index]
  };
}

export function createEngine(corpus, responses) {
  return Object.freeze({
    infer(input) {
      const normalized = canonicalize(input);
      const selected = selectResponse(normalized, corpus);
      const response = responses.responses[selected.responseId];

      if (typeof response !== "string") {
        throw new Error("Corpus references an unknown response: " + selected.responseId);
      }

      return Object.freeze({
        normalized,
        ruleId: selected.ruleId,
        responseId: selected.responseId,
        response
      });
    }
  });
}

export async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(String(input));

  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
  }

  return "fnv1a32:" + fnv1a32(String(input)).toString(16).padStart(8, "0");
}
