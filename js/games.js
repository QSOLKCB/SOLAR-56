export const GAME_IDS = Object.freeze({
  TIC_TAC_TOE: "tic-tac-toe",
  NIM: "nim",
  CONNECT_FOUR: "connect-four"
});

const TTT_LINES = Object.freeze([
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
]);

export function ticTacToeStatus(board) {
  for (const [a,b,c] of TTT_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] === "O" ? "ai" : "user";
    }
  }
  return board.every(Boolean) ? "draw" : "ongoing";
}

function tttMinimax(board, aiTurn, depth) {
  const status = ticTacToeStatus(board);
  if (status === "ai") return 10 - depth;
  if (status === "user") return depth - 10;
  if (status === "draw") return 0;

  const moves = [];
  for (let i = 0; i < board.length; i += 1) {
    if (!board[i]) moves.push(i);
  }

  if (aiTurn) {
    let best = -Infinity;
    for (const move of moves) {
      board[move] = "O";
      best = Math.max(best, tttMinimax(board, false, depth + 1));
      board[move] = "";
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    board[move] = "X";
    best = Math.min(best, tttMinimax(board, true, depth + 1));
    board[move] = "";
  }
  return best;
}

export function ticTacToeBestMove(board) {
  if (ticTacToeStatus(board) !== "ongoing") return null;
  let bestMove = null;
  let bestScore = -Infinity;
  for (let move = 0; move < board.length; move += 1) {
    if (board[move]) continue;
    board[move] = "O";
    const score = tttMinimax(board, false, 1);
    board[move] = "";
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

export function nimBestTake(stones, maxTake = 3) {
  if (!Number.isInteger(stones) || stones <= 0) return 0;
  const legalMax = Math.min(maxTake, stones);
  const remainder = stones % (maxTake + 1);
  return remainder === 0 ? 1 : Math.min(remainder, legalMax);
}

export const CONNECT_ROWS = 6;
export const CONNECT_COLS = 7;
export const CONNECT_MOVE_ORDER = Object.freeze([3,2,4,1,5,0,6]);

export function connectFourEmptyBoard() {
  return Array(CONNECT_ROWS * CONNECT_COLS).fill(0);
}

function c4Index(row, col) {
  return row * CONNECT_COLS + col;
}

export function connectFourDrop(board, col, player) {
  if (!Number.isInteger(col) || col < 0 || col >= CONNECT_COLS) return null;
  for (let row = 0; row < CONNECT_ROWS; row += 1) {
    const index = c4Index(row, col);
    if (board[index] === 0) {
      const next = board.slice();
      next[index] = player;
      return next;
    }
  }
  return null;
}

export function connectFourWinner(board) {
  const directions = [[1,0],[0,1],[1,1],[1,-1]];
  for (let row = 0; row < CONNECT_ROWS; row += 1) {
    for (let col = 0; col < CONNECT_COLS; col += 1) {
      const player = board[c4Index(row,col)];
      if (!player) continue;
      for (const [dr,dc] of directions) {
        let count = 1;
        for (let step = 1; step < 4; step += 1) {
          const r = row + dr * step;
          const c = col + dc * step;
          if (r < 0 || r >= CONNECT_ROWS || c < 0 || c >= CONNECT_COLS) break;
          if (board[c4Index(r,c)] !== player) break;
          count += 1;
        }
        if (count === 4) return player;
      }
    }
  }
  return 0;
}

function connectFourLegalMoves(board) {
  return CONNECT_MOVE_ORDER.filter((col) => board[c4Index(CONNECT_ROWS - 1, col)] === 0);
}

function evaluateWindow(values) {
  const ai = values.filter((v) => v === 2).length;
  const user = values.filter((v) => v === 1).length;
  const empty = 4 - ai - user;
  if (ai === 4) return 100000;
  if (user === 4) return -100000;
  if (ai === 3 && empty === 1) return 120;
  if (ai === 2 && empty === 2) return 18;
  if (user === 3 && empty === 1) return -150;
  if (user === 2 && empty === 2) return -20;
  return 0;
}

export function connectFourEvaluate(board) {
  const winner = connectFourWinner(board);
  if (winner === 2) return 1000000;
  if (winner === 1) return -1000000;

  let score = 0;
  for (let row = 0; row < CONNECT_ROWS; row += 1) {
    if (board[c4Index(row,3)] === 2) score += 6;
    if (board[c4Index(row,3)] === 1) score -= 6;
  }

  const windows = [];
  for (let row = 0; row < CONNECT_ROWS; row += 1) {
    for (let col = 0; col <= CONNECT_COLS - 4; col += 1) {
      windows.push([0,1,2,3].map((d) => board[c4Index(row,col+d)]));
    }
  }
  for (let col = 0; col < CONNECT_COLS; col += 1) {
    for (let row = 0; row <= CONNECT_ROWS - 4; row += 1) {
      windows.push([0,1,2,3].map((d) => board[c4Index(row+d,col)]));
    }
  }
  for (let row = 0; row <= CONNECT_ROWS - 4; row += 1) {
    for (let col = 0; col <= CONNECT_COLS - 4; col += 1) {
      windows.push([0,1,2,3].map((d) => board[c4Index(row+d,col+d)]));
    }
    for (let col = 3; col < CONNECT_COLS; col += 1) {
      windows.push([0,1,2,3].map((d) => board[c4Index(row+d,col-d)]));
    }
  }
  for (const window of windows) score += evaluateWindow(window);
  return score;
}

function c4Search(board, depth, alpha, beta, aiTurn) {
  const winner = connectFourWinner(board);
  const moves = connectFourLegalMoves(board);
  if (winner || depth === 0 || moves.length === 0) {
    return connectFourEvaluate(board);
  }

  if (aiTurn) {
    let value = -Infinity;
    for (const col of moves) {
      value = Math.max(value, c4Search(connectFourDrop(board,col,2), depth - 1, alpha, beta, false));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  }

  let value = Infinity;
  for (const col of moves) {
    value = Math.min(value, c4Search(connectFourDrop(board,col,1), depth - 1, alpha, beta, true));
    beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }
  return value;
}

export function connectFourBestMove(board, depth = 4) {
  if (connectFourWinner(board)) return null;
  const moves = connectFourLegalMoves(board);
  if (moves.length === 0) return null;

  let bestCol = moves[0];
  let bestScore = -Infinity;
  for (const col of moves) {
    const next = connectFourDrop(board,col,2);
    const score = c4Search(next, depth - 1, -Infinity, Infinity, false);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}

const RESULT_ROASTS = Object.freeze({
  "tic-tac-toe": Object.freeze({
    ai: "Three in a row. Nine squares and you still managed to lose to arithmetic with a personality disorder.",
    user: "Congratulations. You beat a supposedly perfect Tic-Tac-Toe engine. Please file a bug before your ego becomes a dependency.",
    draw: "A draw. You have achieved strategic parity with a game solved decades before you were born."
  }),
  nim: Object.freeze({
    ai: "I just beat you with modulo four. The stones were not the stupid part of this game.",
    user: "You found the modulo strategy. Wonderful. Put 'understands remainders' on LinkedIn.",
    draw: "Nim does not draw. If you are seeing this, congratulations: you broke counting."
  }),
  "connect-four": Object.freeze({
    ai: "Four in a row. I searched four plies ahead and still had enough spare time to judge your quarterly plan.",
    user: "You beat the search tree. Enjoy this moment before I increase the depth and ruin your afternoon.",
    draw: "A full board and nobody won. Even your stalemates require forty-two decisions."
  })
});

const MOVE_TAUNTS = Object.freeze([
  "Bold move. Not a good move. But definitely a move.",
  "I have evaluated your strategy and classified it as an emerging incident.",
  "Interesting. The search tree briefly considered feeling sorry for you.",
  "Your plan has strong executive visibility and no measurable path to victory."
]);

export function gameRoast(gameId, outcome) {
  return RESULT_ROASTS[gameId]?.[outcome] ?? "Game over. Somehow we are both worse for having experienced it.";
}

export function moveTaunt(aiMoveNumber) {
  return MOVE_TAUNTS[(Math.max(1, aiMoveNumber) - 1) % MOVE_TAUNTS.length];
}
