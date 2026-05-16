
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
  const [clearingColors, setClearingColors] = useState<Record<string, string>>({});
  const [visualBoard, setVisualBoard] = useState<string[][]>(board);
  const gridRef = useRef<HTMLDivElement>(null);
  const hoverPosRef = useRef(hoverPos);

  // Sync visual board with prop board only when NOT in the middle of a clear animation
  useEffect(() => {
    if (!clearingLines) {
      setVisualBoard(board);
    }
  }, [board, clearingLines]);

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
    const padding = 12; // Adjusted for p-3 (12px)
    const gap = 3;
    const availableWidth = rect.width - (padding * 2);
    const availableHeight = rect.height - (padding * 2);
    const cellWidth = (availableWidth - (BOARD_SIZE - 1) * gap) / BOARD_SIZE;
    const cellHeight = (availableHeight - (BOARD_SIZE - 1) * gap) / BOARD_SIZE;

    // Center the block on the pointer
    const blockWidth = draggedBlock.shape[0].length * (cellWidth + gap) - gap;
    const blockHeight = draggedBlock.shape.length * (cellHeight + gap) - gap;

    const x = dragPosition.x - rect.left - padding - (blockWidth / 2);
    const y = dragPosition.y - rect.top - padding - (blockHeight / 2);

    const r = Math.round(y / (cellHeight + gap));
    const c = Math.round(x / (cellWidth + gap));

    if (r >= -0.5 && r <= BOARD_SIZE - draggedBlock.shape.length + 0.5 && 
        c >= -0.5 && c <= BOARD_SIZE - draggedBlock.shape[0].length + 0.5) {
      const validR = Math.max(0, Math.min(BOARD_SIZE - draggedBlock.shape.length, Math.round(r)));
      const validC = Math.max(0, Math.min(BOARD_SIZE - draggedBlock.shape[0].length, Math.round(c)));
      
      setHoverPos({ r: validR, c: validC });
      onSnapChange?.({
        x: rect.left + padding + (validC * (cellWidth + gap)) + (cellWidth / 2), 
        y: rect.top + padding + (validR * (cellHeight + gap)) + (cellHeight / 2)
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
    
    // 1. Physically place the block on our interim representation
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          interimBoard[startRow + r][startCol + c] = block.color;
        }
      }
    }

    // 2. Identify clearing lines
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
      // 3. Prepare the "Ghost Explosion"
      const colors: Record<string, string> = {};
      const finalBoard = interimBoard.map(row => [...row]);

      // Capture colors for the animation and clear the finalBoard data immediately
      rowsToClear.forEach(r => {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (interimBoard[r][c] !== "empty") colors[`${r}-${c}`] = interimBoard[r][c];
          finalBoard[r][c] = "empty";
        }
      });
      colsToClear.forEach(c => {
        for (let r = 0; r < BOARD_SIZE; r++) {
          if (interimBoard[r][c] !== "empty") colors[`${r}-${c}`] = interimBoard[r][c];
          finalBoard[r][c] = "empty";
        }
      });

      points += linesCleared * 10 * linesCleared;

      // 4. Set states atomically to trigger animation while data is empty
      setClearingColors(colors);
      setClearingLines({ rows: rowsToClear, cols: colsToClear });
      setVisualBoard(finalBoard); // Logic state is now empty
      
      // Update parent immediately so score and inventory move forward
      onPlaced(finalBoard, points, block.id);

      // 5. Cleanup animation flags after visual duration
      setTimeout(() => {
        setClearingLines(null);
        setClearingColors({});
      }, 400); 
    } else {
      setVisualBoard(interimBoard);
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
            const cellKey = `${rIdx}-${cIdx}`;
            const isGhost = placementPreview.ghostCells.some(gc => gc.r === rIdx && gc.c === cIdx);
            const isAboutToClear = placementPreview.rowsToClear.includes(rIdx) || placementPreview.colsToClear.includes(cIdx);
            const isActuallyClearing = clearingLines && (clearingLines.rows.includes(rIdx) || clearingLines.cols.includes(cIdx));
            const clearColor = clearingColors[cellKey];
            
            // Use the "Ghost Color" if we are in the middle of a blast
            const activeColor = isActuallyClearing ? clearColor : (cell !== "empty" ? cell : (isGhost ? draggedBlock?.color : null));

            return (
              <div
                key={cellKey}
                className={cn(
                  "w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-md transition-all duration-150 border-[0.5px] border-white/5",
                  cell === "empty" && !isGhost && !isActuallyClearing ? "bg-white/[0.03]" : "blast-shadow",
                  isAboutToClear && !isActuallyClearing && "animate-flash brightness-150 z-10",
                  isActuallyClearing && "animate-blast-out z-20",
                  isGhost && "z-20"
                )}
                style={{ 
                  backgroundColor: activeColor || undefined,
                  opacity: isGhost && !placementPreview.fits ? 0.3 : 1,
                  boxShadow: (isGhost && placementPreview.fits) || isActuallyClearing ? `0 0 30px ${activeColor}` : undefined,
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
