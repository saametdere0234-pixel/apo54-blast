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

  // Sync internal hover calculations based on global drag position
  useEffect(() => {
    if (!draggedBlock || !dragPosition || !gridRef.current) {
      setHoverPos(null);
      return;
    }

    const rect = gridRef.current.getBoundingClientRect();
    const cellWidth = rect.width / BOARD_SIZE;
    const cellHeight = rect.height / BOARD_SIZE;

    // Use a fixed offset for detection that matches the visual offset in page.tsx
    // The visual offset is roughly 120% of the block size above the cursor
    const detectionOffset = -100; 

    const x = dragPosition.x - rect.left;
    const y = dragPosition.y + detectionOffset - rect.top;

    const r = Math.floor(y / cellHeight);
    const c = Math.floor(x / cellWidth);

    if (r >= 0 && r <= BOARD_SIZE - draggedBlock.shape.length && 
        c >= 0 && c <= BOARD_SIZE - draggedBlock.shape[0].length) {
      setHoverPos({ r, c });
    } else {
      setHoverPos(null);
    }
  }, [draggedBlock, dragPosition]);

  // Use a ref for the latest hoverPos to ensure the pointerup closure is accurate
  const hoverPosRef = useRef(hoverPos);
  useEffect(() => {
    hoverPosRef.current = hoverPos;
  }, [hoverPos]);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      const currentHover = hoverPosRef.current;
      if (draggedBlock && currentHover && canFit(board, draggedBlock.shape, currentHover.r, currentHover.c)) {
        handlePlacement(draggedBlock, currentHover);
      }
    };

    if (draggedBlock) {
      window.addEventListener("pointerup", handleGlobalPointerUp);
    }
    return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
  }, [draggedBlock, board]);

  const handlePlacement = (block: BlockPiece, pos: { r: number, c: number }) => {
    const { r: startRow, c: startCol } = pos;
    const newBoard = board.map(row => [...row]);
    const shape = block.shape;
    
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          newBoard[startRow + r][startCol + c] = block.color;
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

    let points = getBlockSize(block.shape);
    const linesCleared = rowsToClear.length + colsToClear.length;
    if (linesCleared > 0) {
      points += linesCleared * 10 * linesCleared;
      rowsToClear.forEach(r => newBoard[r] = Array(BOARD_SIZE).fill("empty"));
      colsToClear.forEach(c => newBoard.forEach(r => r[c] = "empty"));
    }

    onPlaced(newBoard, points, block.id);
    setHoverPos(null);
  };

  const potentialClears = useMemo(() => {
    if (!draggedBlock || !hoverPos || !canFit(board, draggedBlock.shape, hoverPos.r, hoverPos.c)) 
      return { rows: [], cols: [] };
    
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
  }, [board, draggedBlock, hoverPos]);

  return (
    <div className="relative group/board">
      <div 
        ref={gridRef}
        className="grid grid-cols-8 gap-[3px] p-3 bg-card/60 border border-white/10 rounded-xl shadow-2xl backdrop-blur-sm relative"
      >
        {board.map((row, rIdx) => 
          row.map((cell, cIdx) => {
            const isAboutToClear = potentialClears.rows.includes(rIdx) || potentialClears.cols.includes(cIdx);

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={cn(
                  "w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-md transition-all duration-150 border-[0.5px] border-white/5",
                  cell === "empty" ? "bg-white/[0.03]" : "blast-shadow",
                  isAboutToClear && "animate-flash brightness-125 z-10"
                )}
                style={{ 
                  backgroundColor: cell !== "empty" ? cell : undefined
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
