"use client";

import React, { useState, useEffect } from "react";
import { GameBoard } from "@/components/game/GameBoard";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { BlockInventory } from "@/components/game/BlockInventory";
import { GameOverOverlay } from "@/components/game/GameOverOverlay";
import { Button } from "@/components/ui/button";
import { Play, Sparkles } from "lucide-react";
import { generateRandomBlock, BOARD_SIZE, BlockPiece, getBlockSize } from "@/lib/game-constants";
import { Toaster } from "@/components/ui/toaster";

export default function LuminaGridPage() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [board, setBoard] = useState<string[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill("empty"))
  );
  const [inventory, setInventory] = useState<BlockPiece[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("lumina-grid-highscore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("lumina-grid-highscore", score.toString());
    }
  }, [score, highScore]);

  const startGame = () => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill("empty")));
    setScore(0);
    setInventory([generateRandomBlock(), generateRandomBlock(), generateRandomBlock()]);
    setGameState("playing");
    setSelectedBlockId(null);
  };

  const handleBlockPlaced = (newBoard: string[][], points: number, blockId: string) => {
    setBoard(newBoard);
    setScore(prev => prev + points);
    
    const newInventory = inventory.filter(b => b.id !== blockId);
    if (newInventory.length === 0) {
      setInventory([generateRandomBlock(), generateRandomBlock(), generateRandomBlock()]);
    } else {
      setInventory(newInventory);
    }
    setSelectedBlockId(null);
    checkGameOver(newBoard, newInventory.length === 0 ? [] : newInventory);
  };

  const checkGameOver = (currentBoard: string[][], currentInventory: BlockPiece[]) => {
    // If inventory is empty, new ones are about to be generated, so we check those
    const blocksToCheck = currentInventory.length === 0 
      ? [generateRandomBlock(), generateRandomBlock(), generateRandomBlock()]
      : currentInventory;

    const canPlaceAny = blocksToCheck.some(block => {
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
        <div className="text-center space-y-8 max-w-md w-full">
          <div className="space-y-2">
            <h1 className="text-6xl font-headline font-bold text-primary neon-text tracking-tighter">
              LUMINA<br />GRID
            </h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">Neon Arcade Puzzle</p>
          </div>
          
          <div className="p-1 bg-gradient-to-br from-primary via-accent to-primary rounded-2xl shadow-2xl">
            <div className="bg-card rounded-[14px] p-8 space-y-6">
              <Button 
                onClick={startGame}
                size="lg"
                className="w-full h-16 text-xl font-headline bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <Play className="mr-2 fill-current" /> PLAY NOW
              </Button>
              <div className="flex items-center justify-between text-muted-foreground px-2">
                <span className="text-xs font-bold uppercase tracking-widest">High Score</span>
                <span className="text-lg font-headline font-bold text-secondary">{highScore}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background grid-bg flex flex-col items-center p-4 pt-8 md:pt-12">
      <div className="w-full max-w-xl flex flex-col items-center gap-8 md:gap-12">
        <ScoreBoard score={score} highScore={highScore} />
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-xl blur-xl transition group-hover:opacity-100 opacity-50"></div>
          <GameBoard 
            board={board} 
            selectedBlock={inventory.find(b => b.id === selectedBlockId) || null}
            onPlaced={handleBlockPlaced}
          />
        </div>

        <BlockInventory 
          blocks={inventory} 
          selectedId={selectedBlockId} 
          onSelect={setSelectedBlockId} 
          board={board}
        />
      </div>

      {gameState === "gameover" && (
        <GameOverOverlay score={score} highScore={highScore} onRestart={startGame} />
      )}
      <Toaster />
    </main>
  );
}