# THE LAST TERMINAL

THE LAST TERMINAL is a deterministic old-school text adventure embedded directly in the SOLAR-56 chat terminal.

There is no separate game screen. The ordinary prompt becomes the parser while the adventure is active.

## Entry

The hidden terminal commands are:

- `ADVENTURE`
- `PLAY ADVENTURE`
- `START ADVENTURE`
- `TEXT ADVENTURE`

`QUIT` returns to ordinary SOLAR-56.

## Parser

Supported commands include:

- `LOOK`
- `NORTH`, `SOUTH`, `EAST`, `WEST`
- `GO <DIRECTION>`
- `TAKE <ITEM>`
- `READ <THING>`
- `OPEN SAFE <CODE>`
- `USE <ITEM>`
- `PRESS <THING>`
- `INVENTORY`
- `HELP`
- `RESTART`
- `QUIT`

The parser canonicalizes input using the same normalization contract as SOLAR-56.

## World

The game has six rooms:

1. Retirement Cubicle
2. Synergy Corridor
3. Performance Archive
4. Meeting Room B
5. Server Room
6. Retirement Gate

The successful progression is stateful. The player must discover the safe code, obtain the access badge, unlock the server room, obtain the root key and open the retirement gate.

The red button in the server room is functional.

## Determinism

Adventure state contains only explicit fields:

- current room;
- ordered inventory;
- safe state;
- server-room lock state;
- status;
- turn count.

There is no RNG, clock access, network access or remote inference.

For identical adventure state and identical command input, `runAdventureCommand()` returns an identical next state and identical text.

Roasts are selected by turn number from a fixed ordered corpus, so identical command histories replay exactly.

## Verification

`tests/adventure.test.mjs` covers:

- trigger recognition;
- replay identity;
- locked-server progression;
- incorrect safe code rejection;
- complete winning path;
- red-button losing path;
- restart;
- quit;
- invalid-command behaviour.
