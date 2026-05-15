
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GameBoard } from "@/components/game/GameBoard";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { BlockInventory } from "@/components/game/BlockInventory";
import { GameOverOverlay } from "@/components/game/GameOverOverlay";
import { Button } from "@/components/ui/button";
import { Play, Zap } from "lucide-react";
import { generateRandomBlock, BOARD_SIZE, BlockPiece, canFit } from "@/lib/game-constants";
import { Toaster } from "@/components/ui/toaster";

export default function Apo54BlastPage() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [board, setBoard] = useState<string[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill("empty"))
  );
  const [inventory, setInventory] = useState<BlockPiece[]>([]);
  const [draggedBlock, setDraggedBlock] = useState<BlockPiece | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("apo54-blast-highscore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("apo54-blast-highscore", score.toString());
    }
  }, [score, highScore]);

  // Global pointer move listener for smooth drag tracking
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (draggedBlock) {
        setDragPosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handlePointerUp = () => {
      // Logic for dropping is handled in the GameBoard component via the dragPosition
      // But we need to clean up the drag state here too.
      // We use a small timeout to let the GameBoard handle the placement first
      setTimeout(() => {
        setDraggedBlock(null);
        setDragPosition(null);
      }, 0);
    };

    if (draggedBlock) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggedBlock]);

  const startGame = () => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill("empty")));
    setScore(0);
    setInventory([generateRandomBlock(), generateRandomBlock(), generateRandomBlock()]);
    setGameState("playing");
    setDraggedBlock(null);
    setDragPosition(null);
  };

  const handleBlockPlaced = useCallback((newBoard: string[][], points: number, blockId: string) => {
    setBoard(newBoard);
    setScore(prev => prev + points);
    
    const newInventory = inventory.filter(b => b.id !== blockId);
    if (newInventory.length === 0) {
      const replenished = [generateRandomBlock(), generateRandomBlock(), generateRandomBlock()];
      setInventory(replenished);
      checkGameOver(newBoard, replenished);
    } else {
      setInventory(newInventory);
      checkGameOver(newBoard, newInventory);
    }
    setDraggedBlock(null);
    setDragPosition(null);
  }, [inventory]);

  const checkGameOver = (currentBoard: string[][], currentInventory: BlockPiece[]) => {
    const canPlaceAny = currentInventory.some(block => {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (canFit(currentBoard, block.shape, r, c)) return true;
        }
      }
      return false;
    });

    if (!canPlaceAny) {
      setGameState("gameover");
    }
  };

  if (gameState === "menu") {
    return (
      <main className="min-h-screen bg-background grid-bg flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-12 max-w-md w-full animate-in fade-in zoom-in duration-700">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1 rounded-full border border-primary/20 text-primary text-xs font-bold tracking-[0.3em] uppercase">
              <Zap className="w-3 h-3 fill-current" /> High Octane Puzzle
            </div>
            <h1 className="text-7xl font-headline font-black text-primary blast-text tracking-tighter leading-none italic uppercase">
              APO54<br /><span className="text-white">BLAST!</span>
            </h1>
          </div>
          
          <div className="p-[2px] bg-gradient-to-br from-primary via-secondary to-primary rounded-2xl shadow-[0_0_40px_rgba(255,165,0,0.2)]">
            <div className="bg-card rounded-[14px] p-8 space-y-6">
              <Button 
                onClick={startGame}
                size="lg"
                className="w-full h-16 text-2xl font-black italic bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              >
                START BLASTING
              </Button>
              <div className="flex items-center justify-between text-muted-foreground px-2">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">High Score</span>
                <span className="text-2xl font-headline font-extrabold text-secondary">{highScore.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background grid-bg flex flex-col items-center p-4 pt-6 md:pt-10 overflow-hidden select-none touch-none">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8 md:gap-10">
        <ScoreBoard score={score} highScore={highScore} />
        
        <div className="relative w-full flex flex-col items-center gap-10">
          <GameBoard 
            board={board} 
            draggedBlock={draggedBlock}
            dragPosition={dragPosition}
            onPlaced={handleBlockPlaced}
          />

          <BlockInventory 
            blocks={inventory} 
            activeDragId={draggedBlock?.id || null}
            onDragStart={(block, pos) => {
              setDraggedBlock(block);
              setDragPosition(pos);
            }}
            board={board}
          />
        </div>
      </div>

      {gameState === "gameover" && (
        <GameOverOverlay score={score} highScore={highScore} onRestart={startGame} />
      )}
      
      {/* Visual Drag Preview at Global Level */}
      {draggedBlock && dragPosition && (
        <div 
          className="fixed pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-1/2 opacity-90 transition-transform duration-75 scale-110"
          style={{ left: dragPosition.x, top: dragPosition.y }}
        >
          <div className="flex flex-col gap-[2px]">
            {draggedBlock.shape.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-[2px]">
                {row.map((cell, cIdx) => (
                  <div
                    key={cIdx}
                    className="rounded-md shadow-lg"
                    style={{ 
                      width: 44,
                      height: 44,
                      backgroundColor: cell === 1 ? draggedBlock.color : "transparent",
                      opacity: cell === 1 ? 1 : 0,
                      boxShadow: cell === 1 ? `0 0 25px ${draggedBlock.color}88` : 'none'
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      <Toaster />
    </main>
  );
}
