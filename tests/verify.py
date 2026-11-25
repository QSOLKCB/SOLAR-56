#!/usr/bin/env python3
"""Independent SOLAR-56 corpus and deterministic-selection verifier."""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_json(relative: str) -> dict:
    with (ROOT / relative).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def canonicalize(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", str(value))
    ascii_only = decomposed.encode("ascii", "ignore").decode("ascii").lower()
    cleaned = re.sub(r"[^a-z0-9]+", " ", ascii_only)
    return re.sub(r"\s+", " ", cleaned).strip()


def fnv1a32(value: str) -> int:
    digest = 0x811C9DC5
    for byte in value.encode("ascii"):
        digest ^= byte
        digest = (digest * 0x01000193) & 0xFFFFFFFF
    return digest


def matches(text: str, rule: dict) -> bool:
    exact = rule.get("exact", [])
    if exact and text not in exact:
        return False

    if not all(phrase in text for phrase in rule.get("all", [])):
        return False

    any_terms = rule.get("any", [])
    if any_terms and not any(phrase in text for phrase in any_terms):
        return False

    if any(phrase in text for phrase in rule.get("none", [])):
        return False

    return True


def select(text: str, corpus: dict) -> tuple[str, str]:
    normalized = canonicalize(text)

    for rule in corpus["rules"]:
        if matches(normalized, rule):
            return rule["id"], rule["response"]

    fallbacks = corpus["fallbacks"]
    index = fnv1a32(normalized) % len(fallbacks)
    return "SOL56-RULE-FALLBACK-FNV1A32", fallbacks[index]


def fail(message: str) -> None:
    print("FAIL:", message, file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    corpus = load_json("data/rules.json")
    responses = load_json("data/responses.json")["responses"]
    vectors = load_json("tests/vectors.json")["vectors"]

    if corpus.get("schema") != 1:
        fail("rules schema must be 1")

    if not corpus.get("rules"):
        fail("rule corpus is empty")

    if not corpus.get("fallbacks"):
        fail("fallback corpus is empty")

    rule_ids = [rule["id"] for rule in corpus["rules"]]
    if len(rule_ids) != len(set(rule_ids)):
        fail("duplicate rule id")

    for rule in corpus["rules"]:
        if rule["response"] not in responses:
            fail(f"{rule['id']} references missing response {rule['response']}")

    for response_id in corpus["fallbacks"]:
        if response_id not in responses:
            fail(f"fallback references missing response {response_id}")

    seen_vector_ids: set[str] = set()
    for vector in vectors:
        if vector["id"] in seen_vector_ids:
            fail(f"duplicate vector id {vector['id']}")
        seen_vector_ids.add(vector["id"])

        rule_id, response_id = select(vector["input"], corpus)
        if response_id != vector["response_id"]:
            fail(
                f"{vector['id']}: expected {vector['response_id']}, "
                f"got {response_id} via {rule_id}"
            )

        second = select(vector["input"], corpus)
        if second != (rule_id, response_id):
            fail(f"{vector['id']}: repeated inference changed result")

    print(
        "PASS:",
        f"{len(corpus['rules'])} rules,",
        f"{len(responses)} responses,",
        f"{len(vectors)} vectors,",
        "deterministic replay confirmed",
    )


if __name__ == "__main__":
    main()
