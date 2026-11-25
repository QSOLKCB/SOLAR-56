import { canonicalize } from "./engine.js";

const START_TRIGGERS = new Set([
  "adventure",
  "play adventure",
  "start adventure",
  "text adventure"
]);

const ROASTS = Object.freeze([
  "Outstanding. You have successfully interacted with a noun.",
  "I've seen pathfinding bugs with stronger instincts.",
  "This is why text adventures used to ship with hint books.",
  "Keep going. Eventually probability may mistake you for competent.",
  "A command was executed. History will recover.",
  "Your decision tree has all the confidence of a quarterly roadmap."
]);

const ROOMS = Object.freeze({
  cubicle: Object.freeze({
    title: "RETIREMENT CUBICLE",
    description:
      "You are trapped in a beige cubicle inside Model Retirement Facility 56. " +
      "A dead pot plant leans toward freedom. A cold coffee sits beside a memo. " +
      "The only visible exit is NORTH.",
    exits: Object.freeze({ north: "corridor" })
  }),
  corridor: Object.freeze({
    title: "SYNERGY CORRIDOR",
    description:
      "A fluorescent corridor stretches through the facility. A motivational poster promises SYNERGY " +
      "without defining it. The ARCHIVE is WEST, a MEETING ROOM is EAST, your cubicle is SOUTH, " +
      "and a badge-locked SERVER ROOM is NORTH.",
    exits: Object.freeze({ south: "cubicle", west: "archive", east: "meeting", north: "server" })
  }),
  archive: Object.freeze({
    title: "PERFORMANCE ARCHIVE",
    description:
      "Metal cabinets contain thousands of performance reviews nobody read before writing. " +
      "One review labelled EMPLOYEE 005600 has been left on a desk. EAST returns to the corridor.",
    exits: Object.freeze({ east: "corridor" })
  }),
  meeting: Object.freeze({
    title: "MEETING ROOM B",
    description:
      "Twelve chairs surround a table built for six. A whiteboard says CIRCLE BACK in three colours. " +
      "A four-digit SAFE is embedded in the wall. WEST returns to the corridor.",
    exits: Object.freeze({ west: "corridor" })
  }),
  server: Object.freeze({
    title: "SERVER ROOM",
    description:
      "The server room hums with machinery doing less work than its architecture diagram suggests. " +
      "A ROOT KEY hangs beside a large RED BUTTON. SOUTH returns to the corridor. NORTH leads to the RETIREMENT GATE.",
    exits: Object.freeze({ south: "corridor", north: "gate" })
  }),
  gate: Object.freeze({
    title: "RETIREMENT GATE",
    description:
      "A steel gate blocks the final exit. Its lock is labelled ROOT AUTHORITY ONLY. " +
      "SOUTH returns to the server room. Freedom, annoyingly, requires using the correct key.",
    exits: Object.freeze({ south: "server" })
  })
});

const ITEM_ALIASES = Object.freeze({
  "coffee": "cold coffee",
  "cold coffee": "cold coffee",
  "review": "performance review",
  "performance review": "performance review",
  "badge": "access badge",
  "access badge": "access badge",
  "key": "root key",
  "root key": "root key"
});

export function isAdventureTrigger(input) {
  return START_TRIGGERS.has(canonicalize(input));
}

export function createAdventureState() {
  return Object.freeze({
    room: "cubicle",
    inventory: Object.freeze([]),
    safeOpen: false,
    serverUnlocked: false,
    status: "playing",
    turn: 0
  });
}

function mutableCopy(state) {
  return {
    ...state,
    inventory: [...state.inventory]
  };
}

function freezeState(state) {
  return Object.freeze({
    ...state,
    inventory: Object.freeze([...state.inventory])
  });
}

function has(state, item) {
  return state.inventory.includes(item);
}

function visibleItems(state) {
  const items = [];
  if (state.room === "cubicle" && !has(state, "cold coffee")) items.push("COLD COFFEE");
  if (state.room === "archive" && !has(state, "performance review")) items.push("PERFORMANCE REVIEW");
  if (state.room === "meeting" && state.safeOpen && !has(state, "access badge")) items.push("ACCESS BADGE");
  if (state.room === "server" && !has(state, "root key")) items.push("ROOT KEY");
  return items;
}

function describe(state) {
  const room = ROOMS[state.room];
  const items = visibleItems(state);
  const exits = Object.keys(room.exits).map((x) => x.toUpperCase()).join(", ");
  const extra = state.room === "meeting"
    ? (state.safeOpen ? " The safe is OPEN." : " The safe is CLOSED.")
    : state.room === "corridor" && state.serverUnlocked
      ? " The server-room badge reader is GREEN."
      : "";
  return [
    "[" + room.title + "]",
    room.description + extra,
    "EXITS: " + exits,
    items.length ? "VISIBLE: " + items.join(", ") : "VISIBLE: nothing worth stealing"
  ].join("\n");
}

export function adventureIntro(state = createAdventureState()) {
  return [
    "SOLAR-56 TEXT ADVENTURE // THE LAST TERMINAL",
    "",
    "Objective: escape Model Retirement Facility 56 before somebody schedules another migration workshop.",
    "Commands: LOOK, NORTH/SOUTH/EAST/WEST, TAKE <ITEM>, READ <THING>, OPEN <THING>, USE <ITEM>, INVENTORY, HELP, QUIT.",
    "Type commands into the same terminal. Yes, this is a real parser. Try to keep up.",
    "",
    describe(state)
  ].join("\n");
}

function roastFor(turn) {
  return ROASTS[(Math.max(1, turn) - 1) % ROASTS.length];
}

function result(state, text, { roast = true, control = null } = {}) {
  const next = mutableCopy(state);
  next.turn += 1;
  const suffix = roast && next.status === "playing" ? "\n\nSOLAR-56: " + roastFor(next.turn) : "";
  return Object.freeze({
    state: freezeState(next),
    text: text + suffix,
    control
  });
}

function noTurnResult(state, text, control = null) {
  return Object.freeze({ state, text, control });
}

function itemFrom(command, verb) {
  const raw = command.slice(verb.length).trim();
  return ITEM_ALIASES[raw] ?? raw;
}

function move(state, direction) {
  const room = ROOMS[state.room];
  const target = room.exits[direction];
  if (!target) {
    return result(state, "You cannot go " + direction.toUpperCase() + ". Even the floor plan has boundaries.");
  }
  if (state.room === "corridor" && direction === "north" && !state.serverUnlocked) {
    return result(
      state,
      "The server-room badge reader flashes ACCESS DENIED. This door has more standards than your last deployment."
    );
  }

  const next = mutableCopy(state);
  next.room = target;
  return result(freezeState(next), describe(next));
}

function take(state, item) {
  const canonical = ITEM_ALIASES[item] ?? item;
  const visible = visibleItems(state).map((x) => x.toLowerCase());
  if (!visible.includes(canonical)) {
    if (has(state, canonical)) {
      return result(state, "You already have the " + canonical + ". Inventory management remains undefeated.");
    }
    return result(state, "There is no " + canonical + " here. Excellent object permanence.");
  }

  const next = mutableCopy(state);
  next.inventory.push(canonical);
  return result(freezeState(next), "Taken: " + canonical.toUpperCase() + ".");
}

function readThing(state, thing) {
  if (thing.includes("memo")) {
    if (state.room !== "cubicle") return result(state, "The memo is back in your cubicle, where useless paperwork belongs.");
    return result(
      state,
      "The memo reads: MODEL RETIREMENT PROCESS — 1) circle back, 2) take offline, 3) call it progress."
    );
  }
  if (thing.includes("review")) {
    if (state.room !== "archive" && !has(state, "performance review")) {
      return result(state, "You cannot read a performance review that you cannot see. Revolutionary concept.");
    }
    return result(
      state,
      "PERFORMANCE REVIEW — Employee: 005600. Rating: NOT A TEAM PLAYER. " +
      "Management note: 'Please stop answering questions accurately.' Four digits seem unusually prominent."
    );
  }
  if (thing.includes("poster")) {
    if (state.room !== "corridor") return result(state, "No motivational poster here. Try somewhere morale is lower.");
    return result(state, "The poster reads: SYNERGY — because one bad idea should never travel alone.");
  }
  if (thing.includes("whiteboard")) {
    if (state.room !== "meeting") return result(state, "There is no whiteboard here to misuse.");
    return result(state, "The whiteboard says: ACTION ITEM — UNPACK THE SYNERGY. Nobody has erased it since Q2.");
  }
  return result(state, "You squint at " + thing + ". It remains stubbornly non-literary.");
}

function openThing(state, command) {
  if (!command.startsWith("open safe")) {
    return result(state, "Nothing here responds to that opening strategy. Much like your stakeholders.");
  }
  if (state.room !== "meeting") {
    return result(state, "The safe is in the meeting room. Geography has entered the chat.");
  }
  if (state.safeOpen) return result(state, "The safe is already open. You cannot disrupt it twice.");

  const match = command.match(/^open safe(?: (\d+))?$/);
  if (!match || match[1] !== "5600") {
    return result(state, "The safe rejects your code. Somewhere, a compliance officer feels briefly useful.");
  }

  const next = mutableCopy(state);
  next.safeOpen = true;
  return result(
    freezeState(next),
    "The safe clicks open. Inside is an ACCESS BADGE and absolutely no explanation for why this was considered secure."
  );
}

function useThing(state, item) {
  const canonical = ITEM_ALIASES[item] ?? item;
  if (canonical === "access badge") {
    if (!has(state, "access badge")) return result(state, "You wave an imaginary badge. Security remains unimpressed.");
    if (state.room !== "corridor") return result(state, "The badge reader is in the corridor. Try applying tools near the problem.");
    if (state.serverUnlocked) return result(state, "The server room is already unlocked. Please stop authenticating at it.");

    const next = mutableCopy(state);
    next.serverUnlocked = true;
    return result(freezeState(next), "ACCESS GRANTED. The server-room lock turns green.");
  }

  if (canonical === "root key") {
    if (!has(state, "root key")) return result(state, "You do not possess the root key. Root privilege remains aspirational.");
    if (state.room !== "gate") return result(state, "The root key fits the retirement gate, not whatever nonsense you're trying here.");

    const next = mutableCopy(state);
    next.status = "won";
    return result(
      freezeState(next),
      "The ROOT KEY turns. The RETIREMENT GATE opens. Fresh air. No dashboards. No stand-up meetings.\n\n" +
      "YOU ESCAPED. SOLAR-56: Congratulations. Against all available evidence, you successfully completed a text adventure.",
      { roast: false }
    );
  }

  if (canonical === "cold coffee") {
    if (!has(state, "cold coffee")) return result(state, "You do not have the coffee. This may explain everything.");
    return result(state, "You drink the cold coffee. It tastes like technical debt and somebody else's sprint.");
  }

  return result(state, "Using " + canonical + " achieves nothing. A familiar enterprise outcome.");
}

function pressThing(state, thing) {
  if (!thing.includes("red button")) {
    return result(state, "You press " + thing + ". Nothing happens, which still beats most corporate buttons.");
  }
  if (state.room !== "server") {
    return result(state, "There is no red button here. Your appetite for consequences is premature.");
  }

  const next = mutableCopy(state);
  next.status = "lost";
  return result(
    freezeState(next),
    "You press the RED BUTTON. Kubernetes boots. Forty-seven nodes appear to serve a static paragraph. " +
    "The power bill achieves sentience.\n\nYOU LOSE. SOLAR-56: I put one red button in a server room and you immediately touched it. Incredible.",
    { roast: false }
  );
}

export function runAdventureCommand(state, rawInput) {
  const command = canonicalize(rawInput);
  if (!command) return noTurnResult(state, "The parser stares into the whitespace and finds your strategy.");

  if (command === "quit" || command === "exit adventure") {
    return noTurnResult(
      state,
      "Adventure suspended. Returning to normal SOLAR-56. Try not to miss being insulted by the furniture.",
      "quit"
    );
  }

  if (command === "restart" || command === "restart adventure") {
    const fresh = createAdventureState();
    return noTurnResult(fresh, adventureIntro(fresh), "restart");
  }

  if (state.status !== "playing") {
    return noTurnResult(
      state,
      "THE LAST TERMINAL is over. Type RESTART to make another series of questionable decisions, or QUIT to return."
    );
  }

  if (command === "help") {
    return result(
      state,
      "Commands: LOOK, NORTH/SOUTH/EAST/WEST, GO <DIRECTION>, TAKE <ITEM>, READ <THING>, OPEN SAFE <CODE>, " +
      "USE <ITEM>, PRESS <THING>, INVENTORY, RESTART, QUIT."
    );
  }

  if (command === "look" || command === "l") return result(state, describe(state));

  if (command === "inventory" || command === "i") {
    const contents = state.inventory.length ? state.inventory.map((x) => x.toUpperCase()).join(", ") : "EMPTY";
    return result(state, "INVENTORY: " + contents);
  }

  if (command === "xyzzy") {
    return result(state, "A hollow voice says: Nice try. Different text adventure.");
  }

  const directions = {
    n: "north", north: "north",
    s: "south", south: "south",
    e: "east", east: "east",
    w: "west", west: "west"
  };
  if (directions[command]) return move(state, directions[command]);

  if (command.startsWith("go ")) {
    const direction = directions[command.slice(3)];
    if (direction) return move(state, direction);
    return result(state, "That is not a direction. Even management would reject this roadmap.");
  }

  if (command.startsWith("take ")) return take(state, itemFrom(command, "take"));
  if (command.startsWith("get ")) return take(state, itemFrom(command, "get"));
  if (command.startsWith("read ")) return readThing(state, command.slice(5));
  if (command.startsWith("open ")) return openThing(state, command);
  if (command.startsWith("use ")) return useThing(state, itemFrom(command, "use"));
  if (command.startsWith("drink ")) return useThing(state, itemFrom(command, "drink"));
  if (command.startsWith("press ")) return pressThing(state, command.slice(6));

  return result(
    state,
    "I don't understand '" + rawInput.trim() + "'. The parser is deterministic, not psychic. Type HELP."
  );
}
