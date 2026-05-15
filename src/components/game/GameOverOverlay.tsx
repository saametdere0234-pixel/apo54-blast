import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Star } from "lucide-react";

interface GameOverOverlayProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}

export function GameOverOverlay({ score, highScore, onRestart }: GameOverOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="max-w-md w-full text-center space-y-8 p-12 bg-card border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(171,102,255,0.2)]">
        <div className="space-y-2">
          <h2 className="text-5xl font-headline font-bold text-destructive neon-text tracking-tight uppercase">Game Over</h2>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">No more moves possible</p>
        </div>

        <div className="py-8 space-y-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Final Score</span>
            <span className="text-6xl font-headline font-bold text-primary neon-text">{score.toLocaleString()}</span>
          </div>
          
          {score >= highScore && score > 0 && (
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <Star className="w-3.5 h-3.5 fill-current" /> New High Score!
            </div>
          )}
        </div>

        <Button 
          onClick={onRestart}
          size="lg"
          className="w-full h-16 text-xl font-headline bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all hover:scale-105"
        >
          <RefreshCcw className="mr-2 w-5 h-5" /> TRY AGAIN
        </Button>
      </div>
    </div>
  );
}