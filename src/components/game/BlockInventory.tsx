import React from "react";
import { BlockPiece, BOARD_SIZE } from "@/lib/game-constants";
import { cn } from "@/lib/utils";

interface BlockInventoryProps {
  blocks: BlockPiece[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  board: string[][];
}

export function BlockInventory({ blocks, selectedId, onSelect, board }: BlockInventoryProps) {
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

  return (
    <div className="w-full bg-card/40 border border-white/5 rounded-2xl p-6 flex justify-around items-center min-h-[140px] backdrop-blur-sm">
      {blocks.map((block) => {
        const disabled = !canFitAtAll(block);
        return (
          <div
            key={block.id}
            onClick={() => !disabled && onSelect(block.id === selectedId ? null : block.id)}
            className={cn(
              "p-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center transform",
              selectedId === block.id ? "bg-primary/20 scale-110 ring-2 ring-primary" : "hover:bg-white/5",
              disabled ? "opacity-30 grayscale cursor-not-allowed" : "active:scale-95"
            )}
          >
            <div className="flex flex-col gap-[2px]">
              {block.shape.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-[2px]">
                  {row.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className="w-4 h-4 md:w-5 md:h-5 rounded-[2px]"
                      style={{ 
                        backgroundColor: cell === 1 ? block.color : "transparent",
                        opacity: cell === 1 ? 1 : 0
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}