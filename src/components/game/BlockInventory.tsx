"use client";

import React, { useState, useEffect } from "react";
import { BlockPiece, BOARD_SIZE } from "@/lib/game-constants";
import { cn } from "@/lib/utils";

interface BlockInventoryProps {
  blocks: BlockPiece[];
  onDragStart: (block: BlockPiece | null) => void;
  board: string[][];
}

export function BlockInventory({ blocks, onDragStart, board }: BlockInventoryProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleUp = () => {
      setActiveDragId(null);
      onDragStart(null);
    };

    if (activeDragId) {
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    }
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [activeDragId, onDragStart]);

  const canFitAtAll = (block: BlockPiece) => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (canFit(board, block.shape, r, c)) return true;
      }
    }
    return false;
  };

  const canFit = (currentBoard: string[][], shape: number[][], row: number, col: number) => {
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
  };

  const handleStartDrag = (block: BlockPiece) => {
    if (!canFitAtAll(block)) return;
    setActiveDragId(block.id);
    onDragStart(block);
  };

  return (
    <div className="w-full bg-card/40 border border-white/5 rounded-3xl p-8 flex justify-around items-center min-h-[160px] backdrop-blur-md relative select-none">
      {blocks.map((block) => {
        const disabled = !canFitAtAll(block);
        const isDragging = activeDragId === block.id;

        return (
          <div
            key={block.id}
            onPointerDown={() => handleStartDrag(block)}
            className={cn(
              "p-6 rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-300 flex items-center justify-center transform hover:bg-white/5",
              disabled && "opacity-20 grayscale cursor-not-allowed pointer-events-none",
              isDragging && "opacity-0"
            )}
          >
            <BlockPreview shape={block.shape} color={block.color} size={24} />
          </div>
        );
      })}

      {activeDragId && (
        <div 
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 opacity-90"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          {blocks.find(b => b.id === activeDragId) && (
            <BlockPreview 
              shape={blocks.find(b => b.id === activeDragId)!.shape} 
              color={blocks.find(b => b.id === activeDragId)!.color} 
              size={36} 
            />
          )}
        </div>
      )}
    </div>
  );
}

function BlockPreview({ shape, color, size }: { shape: number[][], color: string, size: number }) {
  return (
    <div className="flex flex-col gap-[2px]">
      {shape.map((row, rIdx) => (
        <div key={rIdx} className="flex gap-[2px]">
          {row.map((cell, cIdx) => (
            <div
              key={cIdx}
              className="rounded-[3px] blast-shadow"
              style={{ 
                width: size,
                height: size,
                backgroundColor: cell === 1 ? color : "transparent",
                opacity: cell === 1 ? 1 : 0
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
