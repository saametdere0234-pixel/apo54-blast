import React from "react";
import { Trophy, Target, Zap } from "lucide-react";

interface ScoreBoardProps {
  score: number;
  highScore: number;
}

export function ScoreBoard({ score, highScore }: ScoreBoardProps) {
  return (
    <div className="w-full flex justify-between items-center gap-6 px-4 py-4 bg-card/40 border border-white/5 rounded-2xl backdrop-blur-sm">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Current Score</span>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl blast-gradient flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="text-primary-foreground w-6 h-6 fill-current" />
          </div>
          <span className="text-5xl font-headline font-black text-white tabular-nums blast-text italic">
            {score.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Best Record</span>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-headline font-bold text-secondary tabular-nums opacity-80 italic">
            {highScore.toLocaleString()}
          </span>
          <Trophy className="text-secondary w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
