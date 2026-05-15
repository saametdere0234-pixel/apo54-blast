
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { BOARD_SIZE, BlockPiece, getBlockSize, canFit } from "@/lib/game-constants";
import { cn } from "@/lib/utils";
import { AIStrategyButton } from "./AIStrategyButton";

interface GameBoardProps {
  board: string[][];
  draggedBlock: BlockPiece | null;
  dragPosition: { x: number; y: number } | null;
  onPlaced: (newBoard: string[][], points: number, blockId: string) => void;
}

export function GameBoard({ board, draggedBlock, dragPosition, onPlaced }: GameBoardProps) {
  const [hoverPos, setHoverPos] = useState<{ r: number; c: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Sync hover position with global drag position
  useEffect(() => {
    if (!draggedBlock || !dragPosition || !gridRef.current) {
      setHoverPos(null);
      return;
    }

    const rect = gridRef.current.getBoundingClientRect();
    const x = dragPosition.x - rect.left;
    const y = dragPosition.y - rect.top;

    // We calculate cell index based on where the cursor is, assuming cursor is center-ish of top-left cell
    const cellWidth = rect.width / BOARD_SIZE;
    const cellHeight = rect.height / BOARD_SIZE;
    
    // Offset to make the "pick up" feel natural (cursor at center of first block cell)
    const r = Math.floor((y - cellHeight / 2) / cellHeight + 0.5);
    const c = Math.floor((x - cellWidth / 2) / cellWidth + 0.5);

    if (r >= 0 && r <= BOARD_SIZE - draggedBlock.shape.length && 
        c >= 0 && c <= BOARD_SIZE - draggedBlock.shape[0].length) {
      setHoverPos({ r, c });
    } else {
      setHoverPos(null);
    }
  }, [draggedBlock, dragPosition]);

  // Handle dropping locally but triggered by global pointerup (synced via state)
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (draggedBlock && hoverPos && isValidPlacement) {
        handlePlacement();
      }
    };

    if (draggedBlock) {
      window.addEventListener("pointerup", handleGlobalPointerUp);
    }
    return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
  }, [draggedBlock, hoverPos]);

  const isValidPlacement = useMemo(() => {
    if (!draggedBlock || !hoverPos) return false;
    return canFit(board, draggedBlock.shape, hoverPos.r, hoverPos.c);
  }, [board, draggedBlock, hoverPos]);

  const handlePlacement = () => {
    if (!draggedBlock || !hoverPos) return;

    const { r: startRow, c: startCol } = hoverPos;
    const newBoard = board.map(row => [...row]);
    const shape = draggedBlock.shape;
    
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          newBoard[startRow + r][startCol + c] = draggedBlock.color;
        }
      }
    }

    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (newBoard[r].every(cell => cell !== "empty")) rowsToClear.push(r);
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      let full = true;
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (newBoard[r][c] === "empty") {
          full = false;
          break;
        }
      }
      if (full) colsToClear.push(c);
    }

    let points = getBlockSize(draggedBlock.shape);
    const linesCleared = rowsToClear.length + colsToClear.length;
    if (linesCleared > 0) {
      points += linesCleared * 10 * linesCleared;
      rowsToClear.forEach(r => newBoard[r] = Array(BOARD_SIZE).fill("empty"));
      colsToClear.forEach(c => newBoard.forEach(r => r[c] = "empty"));
    }

    onPlaced(newBoard, points, draggedBlock.id);
    setHoverPos(null);
  };

  const potentialClears = useMemo(() => {
    if (!draggedBlock || !hoverPos || !isValidPlacement) return { rows: [], cols: [] };
    
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
  }, [board, draggedBlock, hoverPos, isValidPlacement]);

  return (
    <div className="relative group/board">
      <div 
        ref={gridRef}
        className="grid grid-cols-8 gap-[3px] p-3 bg-card/60 border border-white/10 rounded-xl shadow-2xl backdrop-blur-sm relative"
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
                  isHovered && isValidPlacement && "opacity-60",
                  isHovered && !isValidPlacement && "bg-destructive/30 border-destructive/50",
                  isAboutToClear && "animate-flash brightness-125 z-10"
                )}
                style={{ 
                  backgroundColor: cell !== "empty" ? cell : (isHovered && isValidPlacement ? draggedBlock?.color : undefined)
                }}
              />
            );
          })
        )}
      </div>
      
      <div className="absolute -right-20 top-0 hidden lg:block">
        <AIStrategyButton boardState={board} />
      </div>
    </div>
  );
}
