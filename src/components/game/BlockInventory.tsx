
"use client";

import React from "react";
import { BlockPiece } from "@/lib/game-constants";
import { cn } from "@/lib/utils";

interface BlockInventoryProps {
  blocks: BlockPiece[];
  activeDragId: string | null;
  onDragStart: (block: BlockPiece, pos: { x: number; y: number }) => void;
}

export function BlockInventory({ blocks, activeDragId, onDragStart }: BlockInventoryProps) {
  const handleStartDrag = (e: React.PointerEvent, block: BlockPiece) => {
    onDragStart(block, { x: e.clientX, y: e.clientY });
  };

  return (
    <div className="w-full bg-card/40 border border-white/5 rounded-3xl p-8 flex justify-around items-center min-h-[160px] backdrop-blur-md relative select-none">
      {blocks.map((block) => {
        const isDragging = activeDragId === block.id;

        return (
          <div
            key={block.id}
            onPointerDown={(e) => handleStartDrag(e, block)}
            className={cn(
              "p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-300 flex items-center justify-center transform hover:bg-white/5",
              isDragging && "opacity-40 grayscale-[0.5]"
            )}
          >
            <BlockPreview shape={block.shape} color={block.color} size={18} />
          </div>
        );
      })}
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
              className="rounded-[4px] shadow-sm blast-shadow"
              style={{ 
                width: size,
                height: size,
                backgroundColor: cell === 1 ? color : "transparent",
                opacity: cell === 1 ? 1 : 0,
                boxShadow: cell === 1 ? `0 0 10px ${color}66` : 'none',
                border: cell === 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
