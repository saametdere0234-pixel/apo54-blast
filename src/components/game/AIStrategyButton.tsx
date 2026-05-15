
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { aiGameStrategyConsultant, AIGameStrategyConsultantOutput } from "@/ai/flows/ai-game-strategy-consultant-flow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AIStrategyButtonProps {
  boardState: string[][];
}

export function AIStrategyButton({ boardState }: AIStrategyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AIGameStrategyConsultantOutput | null>(null);
  const [open, setOpen] = useState(false);

  const getAdvice = async () => {
    setLoading(true);
    try {
      // Analyze with a generic block since we don't have a single "selected" state 
      // when the button is pressed (it's passive). In a real game we'd pick the best 
      // of the 3 inventory items.
      const result = await aiGameStrategyConsultant({
        boardState: boardState,
        currentBlockColor: "#FFB366",
        currentBlockShape: [[1, 1], [1, 1]]
      });
      setSuggestion(result);
      setOpen(true);
    } catch (error) {
      console.error("AI Strategy failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={getAdvice}
        variant="outline"
        size="icon"
        disabled={loading}
        className="rounded-full w-14 h-14 bg-card hover:bg-accent/20 border-accent/30 text-accent transition-all hover:scale-110 shadow-[0_0_20px_rgba(255,165,0,0.1)]"
        title="AI Strategy Consultant"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Brain className="w-7 h-7" />}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-accent/20 text-foreground max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-headline font-bold text-accent">
              <Sparkles className="text-accent" /> AI Strategy
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Strategic analysis of your current board.
            </DialogDescription>
          </DialogHeader>

          {suggestion && (
            <div className="space-y-6 pt-4">
              <div className="p-5 bg-accent/5 rounded-2xl border border-accent/10 shadow-inner">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/70 mb-3">Consultant's Logic</h4>
                <p className="text-sm font-medium leading-relaxed italic text-foreground/90">
                  &ldquo;{suggestion.explanation}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 px-1">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Position</span>
                  <p className="text-xl font-headline font-bold text-white">
                    Row {suggestion.suggestedPlacement.row}, Col {suggestion.suggestedPlacement.col}
                  </p>
                </div>
                {suggestion.potentialScoreIncrease !== undefined && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Potential Gain</span>
                    <p className="text-xl font-headline font-bold text-primary">
                      +{suggestion.potentialScoreIncrease} <span className="text-xs">PTS</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
