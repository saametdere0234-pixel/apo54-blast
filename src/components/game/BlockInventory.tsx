
"use client";

import React, { useEffect, useState } from "react";
import { BlockPiece } from "@/lib/game-constants";
import { cn } from "@/lib/utils";

interface BlockInventoryProps {
  blocks: BlockPiece[];
  activeDragId: string | null;
  onDragStart: (block: BlockPiece, pos: { x: number; y: number }) => void;
}

export function BlockInventory({ blocks, activeDragId, onDragStart }: BlockInventoryProps) {
  const [displayBlocks, setDisplayBlocks] = useState<BlockPiece[]>(blocks);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (blocks.length < displayBlocks.length) {
      const removed = displayBlocks.find(db => !blocks.find(b => b.id === db.id));
      if (removed) {
        setRemovingId(removed.id);
        const timer = setTimeout(() => {
          setDisplayBlocks(blocks);
          setRemovingId(null);
        }, 300);
        return () => clearTimeout(timer);
      }
    } else {
      setDisplayBlocks(blocks);
    }
  }, [blocks, displayBlocks.length]);

  const handleStartDrag = (e: React.PointerEvent, block: BlockPiece) => {
    onDragStart(block, { x: e.clientX, y: e.clientY });
  };

  return (
    <div className="w-full bg-card/40 border border-white/5 rounded-3xl p-8 flex justify-center items-center gap-4 sm:gap-10 min-h-[160px] backdrop-blur-md relative select-none overflow-hidden">
      {displayBlocks.map((block) => {
        const isDragging = activeDragId === block.id;
        const isRemoving = removingId === block.id;

        return (
          <div
            key={block.id}
            onPointerDown={(e) => handleStartDrag(e, block)}
            className={cn(
              "p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-300 flex items-center justify-center transform hover:bg-white/5 animate-pop-in shrink-0",
              (isDragging || isRemoving) && "opacity-0 scale-0 w-0 h-0 p-0 pointer-events-none -mx-4 overflow-hidden"
            )}
            style={{ 
              transitionProperty: 'all',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            }}
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
