# Deterministic Game Lab

SOLAR-56's Game Lab contains real browser games with deterministic opponents.

## Design contract

The subsystem follows the same engineering principles used throughout QSOLKCB/VANILLAJS:

- explicit game state;
- stable move ordering;
- no hidden randomness;
- identical state + identical input => identical opponent move;
- replay-friendly logic separated from presentation.

The VANILLAJS repository was inspected at commit `3a825cfb1b4eb674e299a6ae4f0fbecb47dbdfff`, including `docs/GAME_MAKER_API.md` and `docs/AGENT_GUIDE.md`. No VANILLAJS runtime code is vendored here because these board games do not need its rendering, physics or fixed-tick machinery. The Game Lab adopts the deterministic contract without importing unnecessary engine surface area.

## Games

### Tic-Tac-Toe

- User: X
- SOLAR-56: O
- Opponent: full minimax search
- Tie-breaking: lowest board index
- Verification: exhaustive legal user branches assert that the AI never loses

### Nim-17

- Start with 17 stones
- Each player takes 1-3 stones
- Taking the final stone wins
- Opponent: optimal modulo-4 strategy when the state is winning; deterministic take-1 fallback from losing states

### Connect Four

- User: circle
- SOLAR-56: diamond
- Opponent: depth-4 alpha-beta search
- Stable move order: center, then expanding outward
- Static evaluation: terminal wins, center control, and deterministic four-cell window scoring
- Verification: replay stability, immediate win selection and immediate threat blocking

## Roasts

Roasts are deterministic game outputs. An AI win always maps to the same game-specific roast; there is no RNG or remote inference involved.

The browser may also emit deterministic move taunts indexed by the AI move count. These are presentation state only and do not affect the game algorithms.
