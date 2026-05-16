
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
    // If a block was removed (placed), we handle the transition
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
      // If blocks were replenished or the count is the same, update immediately
      setDisplayBlocks(blocks);
      setRemovingId(null);
    }
  }, [blocks, displayBlocks.length]);

  const handleStartDrag = (e: React.PointerEvent, block: BlockPiece) => {
    onDragStart(block, { x: e.clientX, y: e.clientY });
  };

  return (
    <div className="w-full bg-card/40 border border-white/5 rounded-3xl p-8 flex justify-center items-center min-h-[180px] backdrop-blur-md relative select-none overflow-hidden">
      <div className="flex items-center justify-center">
        {displayBlocks.map((block) => {
          const isDragging = activeDragId === block.id;
          const isRemoving = removingId === block.id;
          
          // If the block is being dragged OR it is the one just placed (removing), 
          // it should be visually hidden from the inventory.
          const shouldBeHidden = isDragging || isRemoving;

          return (
            <div
              key={block.id}
              className={cn(
                "transition-all duration-300 ease-in-out flex items-center justify-center shrink-0 overflow-hidden",
                isRemoving ? "w-0 opacity-0 px-0" : "w-[120px] sm:w-[150px] md:w-[180px] opacity-100 px-2"
              )}
            >
              <div
                onPointerDown={(e) => handleStartDrag(e, block)}
                className={cn(
                  "p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-300 transform hover:bg-white/5 animate-pop-in shrink-0",
                  // Use transition-none when hidden to avoid a "fade" or "scale" back to visible 
                  // when the drag ends but the removal animation is still running.
                  shouldBeHidden && "opacity-0 invisible transition-none scale-0 pointer-events-none"
                )}
              >
                <BlockPreview shape={block.shape} color={block.color} size={18} />
              </div>
            </div>
          );
        })}
      </div>
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
              className="rounded-[4px] shadow-sm"
              style={{ 
                width: size,
                height: size,
                backgroundColor: cell === 1 ? color : "transparent",
                opacity: cell === 1 ? 1 : 0,
                boxShadow: cell === 1 ? `0 0 15px ${color}44` : 'none',
                border: cell === 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
