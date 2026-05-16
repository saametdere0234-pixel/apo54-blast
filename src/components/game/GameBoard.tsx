
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
  const [visualBoard, setVisualBoard] = useState<string[][]>(board);
  const gridRef = useRef<HTMLDivElement>(null);
  const hoverPosRef = useRef(hoverPos);

  // Synchronize local visual board with parent board state
  useEffect(() => {
    setVisualBoard(board);
  }, [board]);

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
    // Accounting for 12px padding on each side (p-3 = 12px) and 3px gaps between cells
    const padding = 24; 
    const gapsTotal = (BOARD_SIZE - 1) * 3;
    const cellWidth = (rect.width - padding - gapsTotal) / BOARD_SIZE;
    const cellHeight = (rect.height - padding - gapsTotal) / BOARD_SIZE;

    // Center the block calculation based on the cursor position
    const x = dragPosition.x - rect.left - 12 - (draggedBlock.shape[0].length * (cellWidth + 3) / 2);
    const y = dragPosition.y - rect.top - 12 - (draggedBlock.shape.length * (cellHeight + 3) / 2);

    const r = Math.round(y / (cellHeight + 3));
    const c = Math.round(x / (cellWidth + 3));

    if (r >= -0.5 && r <= BOARD_SIZE - draggedBlock.shape.length + 0.5 && 
        c >= -0.5 && c <= BOARD_SIZE - draggedBlock.shape[0].length + 0.5) {
      const validR = Math.max(0, Math.min(BOARD_SIZE - draggedBlock.shape.length, Math.round(r)));
      const validC = Math.max(0, Math.min(BOARD_SIZE - draggedBlock.shape[0].length, Math.round(c)));
      
      setHoverPos({ r: validR, c: validC });
      onSnapChange?.({
        x: rect.left + 12 + (validC * (cellWidth + 3)) + (cellWidth / 2), 
        y: rect.top + 12 + (validR * (cellHeight + 3)) + (cellHeight / 2)
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
    const interimBoard = visualBoard.map(row => [...row]);
    const shape = block.shape;
    
    // Fill interimBoard with the new block immediately for visual consistency
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          interimBoard[startRow + r][startCol + c] = block.color;
        }
      }
    }
    setVisualBoard(interimBoard);

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
      setClearingLines({ rows: rowsToClear, cols: colsToClear });
      points += linesCleared * 10 * linesCleared;

      // Finalize the clear after the animation plays (animation duration is 0.4s)
      setTimeout(() => {
        const finalBoard = interimBoard.map(row => [...row]);
        rowsToClear.forEach(r => finalBoard[r] = Array(BOARD_SIZE).fill("empty"));
        colsToClear.forEach(c => finalBoard.forEach(r => r[c] = "empty"));
        
        // Update local state first to prevent the "reappearing" glitch
        setVisualBoard(finalBoard);
        setClearingLines(null);
        
        // Notify parent to update the source of truth
        onPlaced(finalBoard, points, block.id);
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
        {visualBoard.map((row, rIdx) => 
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
                  transform: isGhost && placementPreview.fits ? 'scale(1.02)' : 'none',
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
