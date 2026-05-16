"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { BOARD_SIZE, BlockPiece, getBlockSize, canFit } from "@/lib/game-constants";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  board: string[][];
  draggedBlock: BlockPiece | null;
  dragPosition: { x: number; y: number } | null;
  onPlaced: (newBoard: string[][], points: number, blockId: string) => void;
  onSnapChange?: (pos: { x: number; y: number } | null) => void;
}

export function GameBoard({ board, draggedBlock, dragPosition, onPlaced, onSnapChange }: GameBoardProps) {
  const [hoverPos, setHoverPos] = useState<{ r: number; c: number } | null>(null);
  const [clearingLines, setClearingLines] = useState<{ rows: number[], cols: number[] } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hoverPosRef = useRef(hoverPos);

  useEffect(() => {
    hoverPosRef.current = hoverPos;
  }, [hoverPos]);

  useEffect(() => {
    if (!draggedBlock || !dragPosition || !gridRef.current) {
      setHoverPos(null);
      onSnapChange?.(null);
      return;
    }

    const rect = gridRef.current.getBoundingClientRect();
    const cellWidth = (rect.width - 24) / BOARD_SIZE; 
    const cellHeight = (rect.height - 24) / BOARD_SIZE;

    const x = dragPosition.x - rect.left - (draggedBlock.shape[0].length * cellWidth / 2);
    const y = dragPosition.y - rect.top - (draggedBlock.shape.length * cellHeight / 2);

    const r = Math.round(y / cellHeight);
    const c = Math.round(x / cellWidth);

    if (r >= 0 && r <= BOARD_SIZE - draggedBlock.shape.length && 
        c >= 0 && c <= BOARD_SIZE - draggedBlock.shape[0].length) {
      setHoverPos({ r, c });
      onSnapChange?.({
        x: rect.left + 12 + (c * (cellWidth + 3)), 
        y: rect.top + 12 + (r * (cellHeight + 3))
      });
    } else {
      setHoverPos(null);
      onSnapChange?.(null);
    }
  }, [draggedBlock, dragPosition, onSnapChange]);

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
    const interimBoard = board.map(row => [...row]);
    const shape = block.shape;
    
    // 1. Show the block on the board immediately
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          interimBoard[startRow + r][startCol + c] = block.color;
        }
      }
    }

    // 2. Calculate lines to clear
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (interimBoard[r].every(cell => cell !== "empty")) rowsToClear.push(r);
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      let full = true;
      for (let r = 0; r < BOARD_SIZE; r++) if (interimBoard[r][c] === "empty") { full = false; break; }
      if (full) colsToClear.push(c);
    }

    let points = getBlockSize(block.shape);
    const linesCleared = rowsToClear.length + colsToClear.length;

    if (linesCleared > 0) {
      // 3. Set clearing state for animation
      setClearingLines({ rows: rowsToClear, cols: colsToClear });
      points += linesCleared * 10 * linesCleared;

      // Wait for blast animation before final callback
      setTimeout(() => {
        const finalBoard = interimBoard.map(row => [...row]);
        rowsToClear.forEach(r => finalBoard[r] = Array(BOARD_SIZE).fill("empty"));
        colsToClear.forEach(c => finalBoard.forEach(r => r[c] = "empty"));
        
        onPlaced(finalBoard, points, block.id);
        setClearingLines(null);
      }, 400);
    } else {
      onPlaced(interimBoard, points, block.id);
    }

    setHoverPos(null);
  };

  const placementPreview = useMemo(() => {
    if (!draggedBlock || !hoverPos) 
      return { ghostCells: [], rowsToClear: [], colsToClear: [], fits: false };
    
    const ghostCells: {r: number, c: number}[] = [];
    const tempBoard = board.map(row => [...row]);
    const { r: row, c: col } = hoverPos;
    const shape = draggedBlock.shape;
    const fits = canFit(board, shape, row, col);

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          const targetR = row + r;
          const targetC = col + c;
          ghostCells.push({ r: targetR, c: targetC });
          if (targetR >= 0 && targetR < BOARD_SIZE && targetC >= 0 && targetC < BOARD_SIZE) {
            tempBoard[targetR][targetC] = draggedBlock.color;
          }
        }
      }
    }

    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];
    if (fits) {
      for (let r = 0; r < BOARD_SIZE; r++) if (tempBoard[r].every(cell => cell !== "empty")) rowsToClear.push(r);
      for (let c = 0; c < BOARD_SIZE; c++) {
        let full = true;
        for (let r = 0; r < BOARD_SIZE; r++) if (tempBoard[r][c] === "empty") { full = false; break; }
        if (full) colsToClear.push(c);
      }
    }

    return { ghostCells, rowsToClear, colsToClear, fits };
  }, [board, draggedBlock, hoverPos]);

  return (
    <div className="relative group/board">
      <div 
        ref={gridRef}
        className="grid grid-cols-8 gap-[3px] p-3 bg-card/60 border border-white/10 rounded-xl shadow-2xl backdrop-blur-sm relative"
      >
        {board.map((row, rIdx) => 
          row.map((cell, cIdx) => {
            const isGhost = placementPreview.ghostCells.some(gc => gc.r === rIdx && gc.c === cIdx);
            const isAboutToClear = placementPreview.rowsToClear.includes(rIdx) || placementPreview.colsToClear.includes(cIdx);
            const isActuallyClearing = clearingLines && (clearingLines.rows.includes(rIdx) || clearingLines.cols.includes(cIdx));
            
            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={cn(
                  "w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-md transition-all duration-150 border-[0.5px] border-white/5",
                  cell === "empty" && !isGhost ? "bg-white/[0.03]" : "blast-shadow",
                  isAboutToClear && !isActuallyClearing && "animate-flash brightness-150 z-10",
                  isActuallyClearing && "animate-blast-out z-20",
                  isGhost && "z-20"
                )}
                style={{ 
                  backgroundColor: cell !== "empty" ? cell : (isGhost ? draggedBlock?.color : undefined),
                  opacity: isGhost ? (placementPreview.fits ? 1 : 0.3) : 1,
                  boxShadow: (isGhost && placementPreview.fits) || isActuallyClearing ? `0 0 30px ${draggedBlock?.color || cell}` : undefined,
                  transform: isGhost && placementPreview.fits ? 'scale(1.02)' : 'none'
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
