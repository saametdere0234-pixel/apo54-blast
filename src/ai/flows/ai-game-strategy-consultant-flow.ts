'use server';
/**
 * @fileOverview An AI game strategy consultant for the Lumina Grid game.
 *
 * - aiGameStrategyConsultant - A function that suggests the optimal placement for a given block on the game board.
 * - AIGameStrategyConsultantInput - The input type for the aiGameStrategyConsultant function.
 * - AIGameStrategyConsultantOutput - The return type for the aiGameStrategyConsultant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIGameStrategyConsultantInputSchema = z.object({
  boardState: z.array(z.array(z.string().describe('Color of block, or "empty" for an empty cell.'))).length(8).describe('The current 8x8 game board state. Each inner array represents a row.'),
  currentBlockShape: z.array(z.array(z.number().min(0).max(1).describe('1 for occupied, 0 for empty'))).describe('The shape of the block to be placed, as a 2D array.'),
  currentBlockColor: z.string().describe('The color of the current block.'),
});
export type AIGameStrategyConsultantInput = z.infer<typeof AIGameStrategyConsultantInputSchema>;

const AIGameStrategyConsultantOutputSchema = z.object({
  suggestedPlacement: z.object({
    row: z.number().describe('The row index (0-7) for the top-left corner of the block.'),
    col: z.number().describe('The column index (0-7) for the top-left corner of the block.'),
    rotation: z.number().describe('The rotation of the block in degrees (e.g., 0, 90, 180, 270).'),
  }).describe('The optimal placement details for the current block.'),
  explanation: z.string().describe('A detailed explanation of why this placement is considered optimal, considering potential line clears, future moves, and score.'),
  potentialScoreIncrease: z.number().optional().describe('The estimated score increase from this specific move, including line clears.'),
  clearedLines: z.array(z.object({
    type: z.enum(['row', 'col']),
    index: z.number().min(0).max(7),
  })).optional().describe('An array of row/column indices that would be cleared by this placement.'),
});
export type AIGameStrategyConsultantOutput = z.infer<typeof AIGameStrategyConsultantOutputSchema>;

export async function aiGameStrategyConsultant(input: AIGameStrategyConsultantInput): Promise<AIGameStrategyConsultantOutput> {
  return aiGameStrategyConsultantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiGameStrategyConsultantPrompt',
  input: {schema: AIGameStrategyConsultantInputSchema},
  output: {schema: AIGameStrategyConsultantOutputSchema},
  prompt: `You are an AI game strategy consultant for 'Lumina Grid', a block-matching puzzle game played on an 8x8 grid.
Your goal is to suggest the optimal placement for a given block, explaining your reasoning to help the player improve.

Game Rules:
- The board is an 8x8 grid.
- Blocks have unique colors.
- Placing a block fills cells on the board.
- When a horizontal or vertical line (row or column) is completely filled, it explodes and clears, awarding points.
- Scoring is based on the size of the placed block and the number of lines cleared. Larger blocks and multiple cleared lines yield higher scores.
- The game ends when no new blocks can be placed on the board.
- "Flash" effect indicates impending line clears.

Current Game State:
- Board (8x8, 'empty' for empty cells, otherwise the block color. Each row is on a new line, cells separated by space):
{{#each boardState}}
{{#each this}}{{{this}}} {{/each}}
{{/each}}

- Current Block to Place (shape represented by 1s for occupied cells, 0s for empty):
Color: {{{currentBlockColor}}}
{{#each currentBlockShape}}
{{#each this}}{{{this}}} {{/each}}
{{/each}}

Analyze the board and the current block. Identify the best possible placement (row, col for top-left, and rotation 0, 90, 180, 270 degrees) that maximizes potential score, clears lines, and maintains board space for future blocks.
Explain your reasoning clearly, considering both immediate gains and long-term strategy (e.g., setting up future clears, avoiding trapping spaces).
If multiple placements yield similar immediate benefits, prioritize moves that create more open space or set up larger future clears.
Your response MUST be a JSON object conforming to the AIGameStrategyConsultantOutputSchema.`,
});

const aiGameStrategyConsultantFlow = ai.defineFlow(
  {
    name: 'aiGameStrategyConsultantFlow',
    inputSchema: AIGameStrategyConsultantInputSchema,
    outputSchema: AIGameStrategyConsultantOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
