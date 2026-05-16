
export type BlockShape = number[][];

export interface BlockPiece {
  id: string;
  shape: BlockShape;
  color: string;
  name: string;
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

const RAW_BLOCK_DEFS: { name: string; color: string; shape: number[][] }[] = [
  { name: '1x1', color: '#FF6666', shape: [[1]] },
  { name: 'Line-2', color: '#FFB366', shape: [[1, 1]] },
  { name: 'Line-3', color: '#FFFF66', shape: [[1, 1, 1]] },
  { name: 'Line-4', color: '#66FF66', shape: [[1, 1, 1, 1]] },
  { name: 'Line-5', color: '#66FFFF', shape: [[1, 1, 1, 1, 1]] },
  { name: 'Square-2', color: '#66B3FF', shape: [[1, 1], [1, 1]] },
  { name: 'Square-3', color: '#B366FF', shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
  { name: 'Rect-3x2', color: '#44CCFF', shape: [[1, 1, 1], [1, 1, 1]] },
  { name: 'L-Small', color: '#FF66B3', shape: [[1, 0], [1, 1]] },
  { name: 'L-Big', color: '#FF9999', shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
  { name: 'Z', color: '#99FF99', shape: [[1, 1, 0], [0, 1, 1]] },
  { name: 'Z-Opp', color: '#99FF99', shape: [[0, 1, 1], [1, 1, 0]] },
  { name: 'Half-Plus', color: '#FFA500', shape: [[1, 1, 1], [0, 1, 0]] },
  { name: 'T-Big', color: '#FF33FF', shape: [[1, 1, 1], [0, 1, 0], [0, 1, 0]] },
  { name: 'U-Shape', color: '#33FFFF', shape: [[1, 0, 1], [1, 1, 1]] },
  { name: 'C-Shape', color: '#FFFF33', shape: [[1, 1], [1, 0], [1, 1]] },
  { name: 'Stairs', color: '#33FF33', shape: [[1, 0, 0], [1, 1, 0], [0, 1, 1]] },
  { name: 'Corner-Big', color: '#FF3333', shape: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
  { name: 'Diagonal-3', color: '#AD66FF', shape: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
  { name: 'Diagonal-2', color: '#AD66FF', shape: [[1, 0], [0, 1]] },
];

// Generate all rotations and remove duplicates
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
        shape: currentShape
      });
      seenShapes.add(shapeStr);
    }
    currentShape = rotateMatrix(currentShape);
  }
});

export const BLOCK_DEFS = PROCESSED_BLOCKS;
export const BOARD_SIZE = 8;

export function generateUniqueInventory(count: number): BlockPiece[] {
  const shuffled = [...BLOCK_DEFS].sort(() => 0.5 - Math.random());
  const selected: BlockPiece[] = [];
  const usedShapes = new Set<string>();

  for (const def of shuffled) {
    const s = shapeToString(def.shape);
    if (selected.length < count && !usedShapes.has(s)) {
      selected.push({
        ...def,
        id: Math.random().toString(36).substring(2, 11)
      });
      usedShapes.add(s);
    }
  }
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
