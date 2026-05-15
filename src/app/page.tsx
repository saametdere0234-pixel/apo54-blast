"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GameBoard } from "@/components/game/GameBoard";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { BlockInventory } from "@/components/game/BlockInventory";
import { GameOverOverlay } from "@/components/game/GameOverOverlay";
import { Button } from "@/components/ui/button";
import { Play, Zap } from "lucide-react";
import { generateRandomBlock, BOARD_SIZE, BlockPiece } from "@/lib/game-constants";
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

  const startGame = () => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill("empty")));
    setScore(0);
    setInventory([generateRandomBlock(), generateRandomBlock(), generateRandomBlock()]);
    setGameState("playing");
    setDraggedBlock(null);
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
    <main className="min-h-screen bg-background grid-bg flex flex-col items-center p-4 pt-6 md:pt-10 overflow-hidden">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8 md:gap-10">
        <ScoreBoard score={score} highScore={highScore} />
        
        <div className="relative w-full flex flex-col items-center gap-10">
          <GameBoard 
            board={board} 
            draggedBlock={draggedBlock}
            onPlaced={handleBlockPlaced}
            onDragStart={setDraggedBlock}
          />

          <BlockInventory 
            blocks={inventory} 
            onDragStart={setDraggedBlock}
            board={board}
          />
        </div>
      </div>

      {gameState === "gameover" && (
        <GameOverOverlay score={score} highScore={highScore} onRestart={startGame} />
      )}
      <Toaster />
    </main>
  );
}
