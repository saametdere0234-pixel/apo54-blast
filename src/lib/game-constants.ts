
export type BlockShape = number[][];

export interface BlockPiece {
  id: string;
  shape: BlockShape;
  color: string;
  name: string;
  weight: number; // For spawning probability
}

function rotateMatrix(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return rotated;
}

function shapeToString(shape: number[][]): string {
  return shape.map(row => row.join('')).join('|');
}

// Original Block Blast Block Definitions with Weights
const RAW_BLOCK_DEFS: { name: string; color: string; shape: number[][]; weight: number }[] = [
  // Useful (Small/Versatile) - Base Weight 1.7 (+70%)
  { name: '1x1', color: '#FF6666', shape: [[1]], weight: 1.7 },
  { name: 'Line-2', color: '#FFB366', shape: [[1, 1]], weight: 1.7 },
  { name: 'Square-2', color: '#66B3FF', shape: [[1, 1], [1, 1]], weight: 1.7 },
  { name: 'L-Small', color: '#FF66B3', shape: [[1, 0], [1, 1]], weight: 1.7 },
  
  // Board Clearing (Large/Lines) - Base Weight 1.2 (+20%)
  { name: 'Line-4', color: '#66FF66', shape: [[1, 1, 1, 1]], weight: 1.2 },
  { name: 'Line-5', color: '#66FFFF', shape: [[1, 1, 1, 1, 1]], weight: 1.2 },
  { name: 'Square-3', color: '#B366FF', shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], weight: 1.2 },
  
  // Standard - Base Weight 1.0
  { name: 'Line-3', color: '#FFFF66', shape: [[1, 1, 1]], weight: 1.0 },
  { name: 'L-Big', color: '#FF9999', shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], weight: 1.0 },
  { name: 'T-Shape', color: '#FF33FF', shape: [[1, 1, 1], [0, 1, 0]], weight: 1.0 },
  { name: 'Z-Shape', color: '#99FF99', shape: [[1, 1, 0], [0, 1, 1]], weight: 1.0 },
  { name: 'S-Shape', color: '#99FF99', shape: [[0, 1, 1], [1, 1, 0]], weight: 1.0 },
];

const PROCESSED_BLOCKS: Omit<BlockPiece, 'id'>[] = [];
const seenShapes = new Set<string>();

RAW_BLOCK_DEFS.forEach(def => {
  let currentShape = def.shape;
  for (let i = 0; i < 4; i++) {
    const shapeStr = shapeToString(currentShape);
    if (!seenShapes.has(shapeStr)) {
      PROCESSED_BLOCKS.push({
        name: `${def.name}-r${i}`,
        color: def.color,
        shape: currentShape,
        weight: def.weight
      });
      seenShapes.add(shapeStr);
    }
    currentShape = rotateMatrix(currentShape);
  }
});

export const BLOCK_DEFS = PROCESSED_BLOCKS;
export const BOARD_SIZE = 8;

export function generateUniqueInventory(count: number, board?: string[][]): BlockPiece[] {
  // Logic: 
  // 1. Calculate how "full" the board is.
  // 2. Adjust weights: if board > 60% full, boost small blocks even more.
  // 3. Ensure at least one block can be placed.
  
  let filledRatio = 0;
  if (board) {
    let filled = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] !== "empty") filled++;
      }
    }
    filledRatio = filled / (BOARD_SIZE * BOARD_SIZE);
  }

  const getAdjustedBlocks = () => {
    return BLOCK_DEFS.map(b => {
      let adjWeight = b.weight;
      // If board is getting full, significantly boost small blocks (Useful category)
      if (filledRatio > 0.6 && b.weight >= 1.7) {
        adjWeight *= 2.5; 
      }
      // If board is very empty, slightly boost large blocks to get them out of the way
      if (filledRatio < 0.2 && b.weight === 1.2) {
        adjWeight *= 1.5;
      }
      return { ...b, adjWeight };
    });
  };

  const attemptGeneration = (): BlockPiece[] => {
    const selected: BlockPiece[] = [];
    const usedShapes = new Set<string>();
    const adjustedBlocks = getAdjustedBlocks();

    while (selected.length < count) {
      const totalWeight = adjustedBlocks.reduce((sum, b) => sum + b.adjWeight, 0);
      let random = Math.random() * totalWeight;
      
      let chosen: Omit<BlockPiece, 'id'> | null = null;
      for (const block of adjustedBlocks) {
        if (random < block.adjWeight) {
          chosen = block;
          break;
        }
        random -= block.adjWeight;
      }

      if (chosen) {
        const s = shapeToString(chosen.shape);
        if (!usedShapes.has(s)) {
          selected.push({
            ...chosen,
            id: Math.random().toString(36).substring(2, 11)
          });
          usedShapes.add(s);
        }
      }
      if (usedShapes.size >= BLOCK_DEFS.length) break;
    }
    return selected;
  };

  // Ensure at least one block fits if board is provided
  let result = attemptGeneration();
  if (board) {
    let placeable = false;
    let attempts = 0;
    while (!placeable && attempts < 10) {
      placeable = result.some(block => {
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (canFit(board, block.shape, r, c)) return true;
          }
        }
        return false;
      });
      if (!placeable) {
        result = attemptGeneration();
      }
      attempts++;
    }
  }

  return result;
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
