"use client";

import React, { useState, useMemo, useCallback } from "react";
import { BOARD_SIZE, BlockPiece, getBlockSize } from "@/lib/game-constants";
import { cn } from "@/lib/utils";
import { AIStrategyButton } from "./AIStrategyButton";

interface GameBoardProps {
  board: string[][];
  draggedBlock: BlockPiece | null;
  onPlaced: (newBoard: string[][], points: number, blockId: string) => void;
  onDragStart: (block: BlockPiece | null) => void;
}

export function GameBoard({ board, draggedBlock, onPlaced, onDragStart }: GameBoardProps) {
  const [hoverPos, setHoverPos] = useState<{ r: number; c: number } | null>(null);

  const canPlace = useMemo(() => {
    if (!draggedBlock || !hoverPos) return false;
    const { r: row, c: col } = hoverPos;
    const shape = draggedBlock.shape;
    
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          const targetR = row + r;
          const targetC = col + c;
          if (targetR < 0 || targetR >= BOARD_SIZE || targetC < 0 || targetC >= BOARD_SIZE) return false;
          if (board[targetR][targetC] !== "empty") return false;
        }
      }
    }
    return true;
  }, [board, draggedBlock, hoverPos]);

  const potentialClears = useMemo(() => {
    if (!draggedBlock || !hoverPos || !canPlace) return { rows: [], cols: [] };
    
    const tempBoard = board.map(row => [...row]);
    const { r: row, c: col } = hoverPos;
    const shape = draggedBlock.shape;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          tempBoard[row + r][col + c] = draggedBlock.color;
        }
      }
    }

    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      if (tempBoard[r].every(cell => cell !== "empty")) rowsToClear.push(r);
    }

    for (let c = 0; c < BOARD_SIZE; c++) {
      let full = true;
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (tempBoard[r][c] === "empty") {
          full = false;
          break;
        }
      }
      if (full) colsToClear.push(c);
    }

    return { rows: rowsToClear, cols: colsToClear };
  }, [board, draggedBlock, hoverPos, canPlace]);

  const handleDrop = useCallback(() => {
    if (draggedBlock && hoverPos && canPlace) {
      const { r: row, c: col } = hoverPos;
      const newBoard = board.map(r => [...r]);
      const shape = draggedBlock.shape;
      
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] === 1) {
            newBoard[row + r][col + c] = draggedBlock.color;
          }
        }
      }

      const rowsToClear: number[] = [];
      const colsToClear: number[] = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (newBoard[r].every(cell => cell !== "empty")) rowsToClear.push(r);
      }
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (newBoard.every(r => r[c] !== "empty")) colsToClear.push(c);
      }

      let points = getBlockSize(draggedBlock.shape);
      const linesCleared = rowsToClear.length + colsToClear.length;
      if (linesCleared > 0) {
        points += linesCleared * 10 * linesCleared;
        rowsToClear.forEach(r => newBoard[r] = Array(BOARD_SIZE).fill("empty"));
        colsToClear.forEach(c => newBoard.forEach(r => r[c] = "empty"));
      }

      onPlaced(newBoard, points, draggedBlock.id);
    }
    setHoverPos(null);
  }, [board, draggedBlock, hoverPos, canPlace, onPlaced]);

  return (
    <div className="relative select-none" onPointerUp={handleDrop}>
      <div 
        className="grid grid-cols-8 gap-[3px] p-3 bg-card/60 border border-white/10 rounded-xl shadow-2xl backdrop-blur-sm relative"
        onPointerLeave={() => setHoverPos(null)}
      >
        {board.map((row, rIdx) => 
          row.map((cell, cIdx) => {
            const isHovered = draggedBlock && hoverPos && 
              rIdx >= hoverPos.r && rIdx < hoverPos.r + draggedBlock.shape.length &&
              cIdx >= hoverPos.c && cIdx < hoverPos.c + draggedBlock.shape[0].length &&
              draggedBlock.shape[rIdx - hoverPos.r][cIdx - hoverPos.c] === 1;

            const isAboutToClear = potentialClears.rows.includes(rIdx) || potentialClears.cols.includes(cIdx);

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={cn(
                  "w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-md transition-all duration-150 border-[0.5px] border-white/5",
                  cell === "empty" ? "bg-white/[0.03]" : "blast-shadow",
                  isHovered && canPlace && "opacity-60",
                  isHovered && !canPlace && "bg-destructive/30 border-destructive/50",
                  isAboutToClear && "animate-flash brightness-125 z-10"
                )}
                style={{ 
                  backgroundColor: cell !== "empty" ? cell : (isHovered && canPlace ? draggedBlock?.color : undefined)
                }}
                onPointerEnter={() => draggedBlock && setHoverPos({ r: rIdx, c: cIdx })}
              />
            );
          })
        )}
      </div>
      
      <div className="absolute -right-20 top-0 hidden lg:block">
        <AIStrategyButton boardState={board} inventory={[]} />
      </div>
    </div>
  );
}
