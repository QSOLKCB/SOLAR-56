import {
  GAME_IDS,
  ticTacToeBestMove,
  ticTacToeStatus,
  nimBestTake,
  connectFourEmptyBoard,
  connectFourDrop,
  connectFourWinner,
  connectFourBestMove,
  CONNECT_ROWS,
  CONNECT_COLS,
  gameRoast,
  moveTaunt
} from "./games.js";

function el(tag, className, text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function mountGameLab({ root, onRoast }) {
  if (!root) return;

  const chooser = root.querySelector("[data-game-chooser]");
  const boardRoot = root.querySelector("[data-game-board]");
  const status = root.querySelector("[data-game-status]");
  const taunt = root.querySelector("[data-game-taunt]");
  const reset = root.querySelector("[data-game-reset]");

  let gameId = GAME_IDS.TIC_TAC_TOE;
  let ttt = [];
  let stones = 17;
  let c4 = [];
  let finished = false;
  let aiMoveNumber = 0;

  function speak(message, final = false) {
    taunt.textContent = message;
    if (final && typeof onRoast === "function") onRoast(message);
  }

  function finish(outcome) {
    finished = true;
    const roast = gameRoast(gameId, outcome);
    speak(roast, true);
    status.textContent = outcome === "ai" ? "SOLAR-56 WINS" :
      outcome === "user" ? "USER WINS" : "DRAW";
  }

  function afterAiMove() {
    aiMoveNumber += 1;
    speak(moveTaunt(aiMoveNumber));
  }

  function renderTtt() {
    boardRoot.replaceChildren();
    boardRoot.className = "game-board ttt-board";
    ttt.forEach((value, index) => {
      const button = el("button", "ttt-cell", value);
      button.type = "button";
      button.disabled = finished || Boolean(value);
      button.setAttribute("aria-label", "Tic-Tac-Toe cell " + (index + 1));
      button.addEventListener("click", () => {
        if (finished || ttt[index]) return;
        ttt[index] = "X";
        let outcome = ticTacToeStatus(ttt);
        if (outcome !== "ongoing") {
          renderTtt();
          finish(outcome);
          return;
        }

        const aiMove = ticTacToeBestMove(ttt);
        if (aiMove !== null) ttt[aiMove] = "O";
        outcome = ticTacToeStatus(ttt);
        renderTtt();
        if (outcome === "ongoing") afterAiMove();
        else finish(outcome);
      });
      boardRoot.append(button);
    });
  }

  function renderNim() {
    boardRoot.replaceChildren();
    boardRoot.className = "game-board nim-board";

    const pile = el("div", "nim-pile");
    pile.setAttribute("aria-label", stones + " stones remaining");
    for (let i = 0; i < stones; i += 1) pile.append(el("span", "nim-stone", "◆"));
    boardRoot.append(pile);

    const controls = el("div", "nim-controls");
    for (let take = 1; take <= 3; take += 1) {
      const button = el("button", "", "TAKE " + take);
      button.type = "button";
      button.disabled = finished || take > stones;
      button.addEventListener("click", () => {
        if (finished || take > stones) return;
        stones -= take;
        if (stones === 0) {
          renderNim();
          finish("user");
          return;
        }

        const aiTake = nimBestTake(stones);
        stones -= aiTake;
        renderNim();
        if (stones === 0) {
          finish("ai");
        } else {
          aiMoveNumber += 1;
          speak("SOLAR-56 takes " + aiTake + ". " + moveTaunt(aiMoveNumber));
          status.textContent = stones + " STONES REMAIN";
        }
      });
      controls.append(button);
    }
    boardRoot.append(controls);
  }

  function c4Full(board) {
    return board.every((cell) => cell !== 0);
  }

  function renderConnectFour() {
    boardRoot.replaceChildren();
    boardRoot.className = "game-board connect-four-board";

    const columnControls = el("div", "connect-columns");
    for (let col = 0; col < CONNECT_COLS; col += 1) {
      const button = el("button", "", "▼");
      button.type = "button";
      button.setAttribute("aria-label", "Drop in Connect Four column " + (col + 1));
      button.disabled = finished || c4[(CONNECT_ROWS - 1) * CONNECT_COLS + col] !== 0;
      button.addEventListener("click", () => {
        if (finished) return;
        const userBoard = connectFourDrop(c4, col, 1);
        if (!userBoard) return;
        c4 = userBoard;
        if (connectFourWinner(c4) === 1) {
          renderConnectFour();
          finish("user");
          return;
        }
        if (c4Full(c4)) {
          renderConnectFour();
          finish("draw");
          return;
        }

        const aiCol = connectFourBestMove(c4, 4);
        if (aiCol !== null) c4 = connectFourDrop(c4, aiCol, 2);
        renderConnectFour();
        if (connectFourWinner(c4) === 2) {
          finish("ai");
        } else if (c4Full(c4)) {
          finish("draw");
        } else {
          aiMoveNumber += 1;
          speak("SOLAR-56 drops column " + (aiCol + 1) + ". " + moveTaunt(aiMoveNumber));
        }
      });
      columnControls.append(button);
    }
    boardRoot.append(columnControls);

    const grid = el("div", "connect-grid");
    for (let displayRow = CONNECT_ROWS - 1; displayRow >= 0; displayRow -= 1) {
      for (let col = 0; col < CONNECT_COLS; col += 1) {
        const value = c4[displayRow * CONNECT_COLS + col];
        const cell = el("span", "connect-cell " + (value === 1 ? "user-piece" : value === 2 ? "ai-piece" : ""));
        cell.textContent = value === 1 ? "●" : value === 2 ? "◆" : "·";
        grid.append(cell);
      }
    }
    boardRoot.append(grid);
  }

  function render() {
    if (gameId === GAME_IDS.TIC_TAC_TOE) renderTtt();
    else if (gameId === GAME_IDS.NIM) renderNim();
    else renderConnectFour();
  }

  function start(nextGame = gameId) {
    gameId = nextGame;
    finished = false;
    aiMoveNumber = 0;
    ttt = Array(9).fill("");
    stones = 17;
    c4 = connectFourEmptyBoard();
    taunt.textContent = "Deterministic opponent ready. Your dignity is not part of the saved state.";
    status.textContent = gameId === GAME_IDS.NIM ? "17 STONES — TAKE 1 TO 3" :
      gameId === GAME_IDS.CONNECT_FOUR ? "YOU ARE ● — SOLAR-56 IS ◆" :
      "YOU ARE X — SOLAR-56 IS O";
    chooser.querySelectorAll("[data-game]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.game === gameId));
    });
    render();
  }

  chooser.addEventListener("click", (event) => {
    const button = event.target.closest("[data-game]");
    if (button) start(button.dataset.game);
  });
  reset.addEventListener("click", () => start());

  start();
}
