"use client";

import React, { useState, useMemo } from "react";
import { BOARD_SIZE, BlockPiece, getBlockSize } from "@/lib/game-constants";
import { cn } from "@/lib/utils";
import { AIStrategyButton } from "./AIStrategyButton";

interface GameBoardProps {
  board: string[][];
  selectedBlock: BlockPiece | null;
  onPlaced: (newBoard: string[][], points: number, blockId: string) => void;
}

export function GameBoard({ board, selectedBlock, onPlaced }: GameBoardProps) {
  const [hoverPos, setHoverPos] = useState<{ r: number; c: number } | null>(null);

  const canPlace = useMemo(() => {
    if (!selectedBlock || !hoverPos) return false;
    const { r: row, c: col } = hoverPos;
    const shape = selectedBlock.shape;
    
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
  }, [board, selectedBlock, hoverPos]);

  const potentialClears = useMemo(() => {
    if (!selectedBlock || !hoverPos || !canPlace) return { rows: [], cols: [] };
    
    // Create temporary board
    const tempBoard = board.map(row => [...row]);
    const { r: row, c: col } = hoverPos;
    const shape = selectedBlock.shape;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          tempBoard[row + r][col + c] = selectedBlock.color;
        }
      }
    }

    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    // Check rows
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (tempBoard[r].every(cell => cell !== "empty")) rowsToClear.push(r);
    }

    // Check cols
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
  }, [board, selectedBlock, hoverPos, canPlace]);

  const handleCellClick = (row: number, col: number) => {
    if (selectedBlock && canPlace) {
      const newBoard = board.map(r => [...r]);
      const shape = selectedBlock.shape;
      
      // Place block
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] === 1) {
            newBoard[row + r][col + c] = selectedBlock.color;
          }
        }
      }

      // Calculate lines to clear
      const rowsToClear: number[] = [];
      const colsToClear: number[] = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (newBoard[r].every(cell => cell !== "empty")) rowsToClear.push(r);
      }
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (newBoard.every(r => r[c] !== "empty")) colsToClear.push(c);
      }

      // Clear lines and calculate points
      let points = getBlockSize(selectedBlock.shape);
      const linesCleared = rowsToClear.length + colsToClear.length;
      if (linesCleared > 0) {
        points += linesCleared * 10 * linesCleared; // Bonus for multi-line
        
        // Mark for explosion animation (in a real app we'd use a timer, here we clear immediately but the logic is there)
        rowsToClear.forEach(r => newBoard[r] = Array(BOARD_SIZE).fill("empty"));
        colsToClear.forEach(c => newBoard.forEach(r => r[c] = "empty"));
      }

      onPlaced(newBoard, points, selectedBlock.id);
    }
  };

  return (
    <div className="relative">
      <div 
        className="grid grid-cols-8 gap-1 p-2 bg-card/80 border border-white/5 rounded-xl shadow-2xl backdrop-blur-md"
        onMouseLeave={() => setHoverPos(null)}
      >
        {board.map((row, rIdx) => 
          row.map((cell, cIdx) => {
            const isHovered = selectedBlock && hoverPos && 
              rIdx >= hoverPos.r && rIdx < hoverPos.r + selectedBlock.shape.length &&
              cIdx >= hoverPos.c && cIdx < hoverPos.c + selectedBlock.shape[0].length &&
              selectedBlock.shape[rIdx - hoverPos.r][cIdx - hoverPos.c] === 1;

            const isAboutToClear = potentialClears.rows.includes(rIdx) || potentialClears.cols.includes(cIdx);

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-[4px] transition-all duration-200 cursor-pointer border border-transparent",
                  cell === "empty" ? "bg-white/5" : "neon-shadow",
                  isHovered && canPlace && "bg-opacity-50",
                  isHovered && !canPlace && "bg-destructive/20 border-destructive/50",
                  isAboutToClear && "animate-flash brightness-150 z-10"
                )}
                style={{ 
                  backgroundColor: cell !== "empty" ? cell : (isHovered && canPlace ? selectedBlock?.color : undefined)
                }}
                onMouseEnter={() => setHoverPos({ r: rIdx, c: cIdx })}
                onClick={() => handleCellClick(hoverPos?.r ?? rIdx, hoverPos?.c ?? cIdx)}
              />
            );
          })
        )}
      </div>
      <div className="absolute -right-16 top-0 hidden md:block">
        <AIStrategyButton boardState={board} inventory={[]} />
      </div>
    </div>
  );
}