
export type BlockShape = number[][];

export interface BlockPiece {
  id: string;
  shape: BlockShape;
  color: string;
  name: string;
}

export const BLOCK_DEFS: Omit<BlockPiece, 'id'>[] = [
  { name: '1x1', color: '#FF6666', shape: [[1]] },
  { name: '2x1', color: '#FFB366', shape: [[1, 1]] },
  { name: '1x2', color: '#FFB366', shape: [[1], [1]] },
  { name: '3x1', color: '#FFFF66', shape: [[1, 1, 1]] },
  { name: '1x3', color: '#FFFF66', shape: [[1], [1], [1]] },
  { name: '4x1', color: '#66FF66', shape: [[1, 1, 1, 1]] },
  { name: '1x4', color: '#66FF66', shape: [[1], [1], [1], [1]] },
  { name: '5x1', color: '#66FFFF', shape: [[1, 1, 1, 1, 1]] },
  { name: '1x5', color: '#66FFFF', shape: [[1], [1], [1], [1], [1]] },
  { name: '2x2', color: '#66B3FF', shape: [[1, 1], [1, 1]] },
  { name: '3x3', color: '#B366FF', shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
  { name: '3x2', color: '#44CCFF', shape: [[1, 1, 1], [1, 1, 1]] },
  { name: '2x3', color: '#44CCFF', shape: [[1, 1], [1, 1], [1, 1]] },
  { name: 'L-Small', color: '#FF66B3', shape: [[1, 0], [1, 1]] },
  { name: 'L-Small-Opp', color: '#FF66B3', shape: [[0, 1], [1, 1]] },
  { name: 'L-Big', color: '#FF9999', shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
  { name: 'L-Big-Opp', color: '#FF9999', shape: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
  { name: 'Z', color: '#99FF99', shape: [[1, 1, 0], [0, 1, 1]] },
  { name: 'Z-Opp', color: '#99FF99', shape: [[0, 1, 1], [1, 1, 0]] },
  { name: 'Half-Plus', color: '#FFA500', shape: [[1, 1, 1], [0, 1, 0]] },
  { name: 'T-Big', color: '#FF33FF', shape: [[1, 1, 1], [0, 1, 0], [0, 1, 0]] },
  { name: 'U-Shape', color: '#33FFFF', shape: [[1, 0, 1], [1, 1, 1]] },
  { name: 'C-Shape', color: '#FFFF33', shape: [[1, 1], [1, 0], [1, 1]] },
  { name: 'Stairs', color: '#33FF33', shape: [[1, 0, 0], [1, 1, 0], [0, 1, 1]] },
  { name: 'Corner-Big', color: '#FF3333', shape: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
  { name: 'Cross3-Left', color: '#AD66FF', shape: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
  { name: 'Cross3-Right', color: '#AD66FF', shape: [[0, 0, 1], [0, 1, 0], [1, 0, 0]] },
  { name: 'Cross2-Left', color: '#AD66FF', shape: [[1, 0], [0, 1]] },
  { name: 'Cross2-Right', color: '#AD66FF', shape: [[0, 1], [1, 0]] },
];

export const BOARD_SIZE = 8;

/**
 * Generates a specified number of unique blocks.
 */
export function generateUniqueInventory(count: number): BlockPiece[] {
  const shuffled = [...BLOCK_DEFS].sort(() => 0.5 - Math.random());
  const selected: BlockPiece[] = [];
  const usedNames = new Set<string>();

  for (const def of shuffled) {
    if (selected.length < count && !usedNames.has(def.name)) {
      selected.push({
        ...def,
        id: Math.random().toString(36).substr(2, 9)
      });
      usedNames.add(def.name);
    }
  }
  return selected;
}

/**
 * Strategic generator that prioritizes blocks that can clear lines.
 */
export function generateStrategicInventory(board: string[][], count: number): BlockPiece[] {
  const scoredBlocks = BLOCK_DEFS.map(def => {
    let bestScore = -1;
    for (let r = 0; r <= BOARD_SIZE - def.shape.length; r++) {
      for (let c = 0; c <= BOARD_SIZE - def.shape[0].length; c++) {
        if (canFit(board, def.shape, r, c)) {
          let score = 10; // Base score for fitting
          
          const tempBoard = board.map(row => [...row]);
          for (let dr = 0; dr < def.shape.length; dr++) {
            for (let dc = 0; dc < def.shape[dr].length; dc++) {
              if (def.shape[dr][dc] === 1) tempBoard[r + dr][c + dc] = def.color;
            }
          }

          let cleared = 0;
          for (let i = 0; i < BOARD_SIZE; i++) {
            if (tempBoard[i].every(cell => cell !== "empty")) cleared++;
            let fullCol = true;
            for (let j = 0; j < BOARD_SIZE; j++) if (tempBoard[j][i] === "empty") { fullCol = false; break; }
            if (fullCol) cleared++;
          }
          score += cleared * 100;
          if (score > bestScore) bestScore = score;
        }
      }
    }
    return { def, score: bestScore };
  });

  const candidates = scoredBlocks.filter(b => b.score > 0).sort((a, b) => b.score - a.score);
  
  if (candidates.length === 0) return generateUniqueInventory(count);

  const selected: BlockPiece[] = [];
  const usedNames = new Set<string>();
  const topPool = candidates.slice(0, Math.max(count, Math.ceil(candidates.length * 0.4)));

  while (selected.length < count && topPool.length > 0) {
    const idx = Math.floor(Math.random() * topPool.length);
    const item = topPool.splice(idx, 1)[0];
    if (!usedNames.has(item.def.name)) {
      selected.push({ ...item.def, id: Math.random().toString(36).substr(2, 9) });
      usedNames.add(item.def.name);
    }
  }

  if (selected.length < count) return generateUniqueInventory(count);
  return selected;
}

export function getBlockSize(shape: BlockShape): number {
  return shape.reduce((acc, row) => acc + row.reduce((rAcc, cell) => rAcc + cell, 0), 0);
}

export function canFit(currentBoard: string[][], shape: number[][], row: number, col: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1) {
        const targetR = row + r;
        const targetC = col + c;
        if (targetR < 0 || targetR >= BOARD_SIZE || targetC < 0 || targetC >= BOARD_SIZE) return false;
        if (currentBoard[targetR][targetC] !== "empty") return false;
      }
    }
  }
  return true;
}
