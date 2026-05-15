import React from "react";
import { Trophy, Target } from "lucide-react";

interface ScoreBoardProps {
  score: number;
  highScore: number;
}

export function ScoreBoard({ score, highScore }: ScoreBoardProps) {
  return (
    <div className="w-full flex justify-between items-end gap-4 px-2">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Current Score</span>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Target className="text-primary w-5 h-5" />
          </div>
          <span className="text-4xl font-headline font-bold text-primary tabular-nums neon-text">
            {score.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Personal Best</span>
        <div className="flex items-center gap-2">
          <span className="text-xl font-headline font-bold text-secondary tabular-nums">
            {highScore.toLocaleString()}
          </span>
          <Trophy className="text-secondary w-4 h-4" />
        </div>
      </div>
    </div>
  );
}