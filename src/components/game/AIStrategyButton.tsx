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
  inventory: any[]; // Placeholder for current block
}

export function AIStrategyButton({ boardState }: AIStrategyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AIGameStrategyConsultantOutput | null>(null);
  const [open, setOpen] = useState(false);

  const getAdvice = async () => {
    // This is a mock block since we'd need to pass the actual selected block
    // In a real implementation, this would be tied to the current selection
    setLoading(true);
    try {
      const result = await aiGameStrategyConsultant({
        boardState: boardState,
        currentBlockColor: "#AB66FF",
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
        className="rounded-full w-12 h-12 bg-card hover:bg-accent/20 border-accent/30 text-accent transition-all hover:scale-110"
        title="AI Strategy Consultant"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Brain className="w-6 h-6" />}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-accent/20 text-foreground max-w-md">
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
              <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-2">The Play</h4>
                <p className="text-sm font-medium leading-relaxed italic">
                  &ldquo;{suggestion.explanation}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Suggested Position</span>
                  <p className="text-lg font-headline font-bold">
                    Row {suggestion.suggestedPlacement.row}, Col {suggestion.suggestedPlacement.col}
                  </p>
                </div>
                {suggestion.potentialScoreIncrease !== undefined && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Potential Gain</span>
                    <p className="text-lg font-headline font-bold text-primary">
                      +{suggestion.potentialScoreIncrease} pts
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