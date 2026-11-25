import assert from "node:assert/strict";
import {
  GAME_IDS,
  ticTacToeBestMove,
  ticTacToeStatus,
  nimBestTake,
  connectFourEmptyBoard,
  connectFourDrop,
  connectFourWinner,
  connectFourBestMove,
  gameRoast
} from "../js/games.js";

function exhaustiveTtt(board = Array(9).fill(""), userTurn = true) {
  const status = ticTacToeStatus(board);
  if (status !== "ongoing") {
    assert.notEqual(status, "user", "perfect Tic-Tac-Toe AI must never lose");
    return;
  }

  if (!userTurn) {
    const move = ticTacToeBestMove(board);
    assert.notEqual(move, null);
    const next = board.slice();
    next[move] = "O";
    exhaustiveTtt(next, true);
    return;
  }

  for (let i = 0; i < board.length; i += 1) {
    if (board[i]) continue;
    const next = board.slice();
    next[i] = "X";
    exhaustiveTtt(next, false);
  }
}

exhaustiveTtt();

for (let stones = 1; stones <= 64; stones += 1) {
  const take = nimBestTake(stones);
  assert.ok(take >= 1 && take <= Math.min(3, stones));
  if (stones % 4 !== 0) assert.equal((stones - take) % 4, 0);
}

let board = connectFourEmptyBoard();
board = connectFourDrop(board, 3, 1);
assert.equal(connectFourBestMove(board, 4), connectFourBestMove(board, 4), "Connect Four move must replay identically");

let aiWin = connectFourEmptyBoard();
aiWin = connectFourDrop(aiWin, 0, 2);
aiWin = connectFourDrop(aiWin, 1, 2);
aiWin = connectFourDrop(aiWin, 2, 2);
assert.equal(connectFourBestMove(aiWin, 4), 3, "AI must take immediate horizontal win");

let block = connectFourEmptyBoard();
block = connectFourDrop(block, 0, 1);
block = connectFourDrop(block, 1, 1);
block = connectFourDrop(block, 2, 1);
assert.equal(connectFourBestMove(block, 4), 3, "AI must block immediate user win");

let vertical = connectFourEmptyBoard();
vertical = connectFourDrop(vertical, 6, 2);
vertical = connectFourDrop(vertical, 6, 2);
vertical = connectFourDrop(vertical, 6, 2);
vertical = connectFourDrop(vertical, 6, 2);
assert.equal(connectFourWinner(vertical), 2);

for (const gameId of Object.values(GAME_IDS)) {
  assert.match(gameRoast(gameId, "ai"), /./);
  assert.equal(gameRoast(gameId, "ai"), gameRoast(gameId, "ai"));
}

console.log("PASS: deterministic game engines, exhaustive Tic-Tac-Toe safety, Nim strategy, Connect Four search and roasts");
