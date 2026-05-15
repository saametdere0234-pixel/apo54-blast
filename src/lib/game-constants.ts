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
  { name: 'L-Small', color: '#FF66B3', shape: [[1, 0], [1, 1]] },
  { name: 'L-Small-Opp', color: '#FF66B3', shape: [[0, 1], [1, 1]] },
  { name: 'L-Big', color: '#FF9999', shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
  { name: 'L-Big-Opp', color: '#FF9999', shape: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
  { name: 'Z', color: '#99FF99', shape: [[1, 1, 0], [0, 1, 1]] },
  { name: 'Z-Opp', color: '#99FF99', shape: [[0, 1, 1], [1, 1, 0]] },
];

export const BOARD_SIZE = 8;

export function generateRandomBlock(): BlockPiece {
  const def = BLOCK_DEFS[Math.floor(Math.random() * BLOCK_DEFS.length)];
  return {
    ...def,
    id: Math.random().toString(36).substr(2, 9)
  };
}

export function getBlockSize(shape: BlockShape): number {
  return shape.reduce((acc, row) => acc + row.reduce((rAcc, cell) => rAcc + cell, 0), 0);
}