import assert from "node:assert/strict";
import {
  isAdventureTrigger,
  createAdventureState,
  adventureIntro,
  runAdventureCommand
} from "../js/adventure.js";

assert.equal(isAdventureTrigger("ADVENTURE"), true);
assert.equal(isAdventureTrigger("Play Adventure"), true);
assert.equal(isAdventureTrigger("please play adventure"), false);

const start = createAdventureState();
assert.equal(start.room, "cubicle");
assert.equal(start.status, "playing");
assert.match(adventureIntro(start), /THE LAST TERMINAL/);

const replayA = runAdventureCommand(start, "look");
const replayB = runAdventureCommand(start, "look");
assert.deepEqual(replayA, replayB, "same state + command must replay exactly");

let blocked = runAdventureCommand(start, "north").state;
assert.equal(blocked.room, "corridor");
const denied = runAdventureCommand(blocked, "north");
assert.equal(denied.state.room, "corridor");
assert.match(denied.text, /ACCESS DENIED/);

let wrongSafe = runAdventureCommand(blocked, "east").state;
wrongSafe = runAdventureCommand(wrongSafe, "open safe 1234").state;
assert.equal(wrongSafe.safeOpen, false);

let state = createAdventureState();
const commands = [
  "north",
  "west",
  "take performance review",
  "read performance review",
  "east",
  "east",
  "open safe 5600",
  "take access badge",
  "west",
  "use access badge",
  "north",
  "take root key",
  "north",
  "use root key"
];

let finalText = "";
for (const command of commands) {
  const next = runAdventureCommand(state, command);
  state = next.state;
  finalText = next.text;
}
assert.equal(state.status, "won");
assert.equal(state.room, "gate");
assert.ok(state.inventory.includes("access badge"));
assert.ok(state.inventory.includes("root key"));
assert.match(finalText, /YOU ESCAPED/);

let doomed = createAdventureState();
for (const command of [
  "north", "west", "east", "east", "open safe 5600", "take access badge",
  "west", "use access badge", "north", "press red button"
]) {
  doomed = runAdventureCommand(doomed, command).state;
}
assert.equal(doomed.status, "lost");

const quit = runAdventureCommand(createAdventureState(), "quit");
assert.equal(quit.control, "quit");
assert.equal(quit.state.turn, 0);

const restartFromLoss = runAdventureCommand(doomed, "restart");
assert.equal(restartFromLoss.control, "restart");
assert.equal(restartFromLoss.state.status, "playing");
assert.equal(restartFromLoss.state.room, "cubicle");
assert.equal(restartFromLoss.state.turn, 0);

const invalid = runAdventureCommand(createAdventureState(), "deploy microservices");
assert.equal(invalid.state.room, "cubicle");
assert.equal(invalid.state.turn, 1);
assert.match(invalid.text, /deterministic, not psychic/);

console.log("PASS: THE LAST TERMINAL parser, replay, progression gates, win/loss paths, restart and quit");
