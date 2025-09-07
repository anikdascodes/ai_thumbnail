'use server';

/**
 * @fileOverview This file defines a Genkit flow for iteratively editing a thumbnail image based on user prompts, 
 * using the Gemini 2.5 Flash Image Model to maintain character consistency and allow for precise image adjustments.
 *
 * @exports iterativelyEditThumbnail - The main function to initiate the thumbnail editing flow.
 * @exports IterativelyEditThumbnailInput - The input type for the iterativelyEditThumbnail function.
 * @exports IterativelyEditThumbnailOutput - The output type for the iterativelyEditThumbnail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IterativelyEditThumbnailInputSchema = z.object({
  baseImage: z
    .string()
    .describe(
      "The base image to edit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('The prompt describing the desired edits to the thumbnail.'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).describe('The aspect ratio of the thumbnail.'),
});
export type IterativelyEditThumbnailInput = z.infer<typeof IterativelyEditThumbnailInputSchema>;

const IterativelyEditThumbnailOutputSchema = z.object({
  editedThumbnail: z
    .string()
    .describe("The edited thumbnail as a data URI in base64 format."),
});
export type IterativelyEditThumbnailOutput = z.infer<typeof IterativelyEditThumbnailOutputSchema>;

export async function iterativelyEditThumbnail(input: IterativelyEditThumbnailInput): Promise<IterativelyEditThumbnailOutput> {
  return iterativelyEditThumbnailFlow(input);
}

const iterativelyEditThumbnailFlow = ai.defineFlow(
  {
    name: 'iterativelyEditThumbnailFlow',
    inputSchema: IterativelyEditThumbnailInputSchema,
    outputSchema: IterativelyEditThumbnailOutputSchema,
  },
  async input => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      system: `You are an expert image editor.
${input.aspectRatio === '9:16'
  ? 'You MUST edit the image to have an aspect ratio of EXACTLY 9:16 (vertical). Do not add any padding or black bars. Do NOT crop or cut any text or subjects; instead, scale and reposition elements so that all content remains fully inside the 9:16 frame with comfortable safe margins.'
  : `You MUST edit the image to have an aspect ratio of EXACTLY ${input.aspectRatio}. Do not add any padding or black bars. Crop the image to fit the requested aspect ratio if necessary.`}
`,
      prompt: [
        { media: { url: input.baseImage } },
        { text: `User edit prompt: ${input.prompt}` },
      ],
    });

    if (!media || !media.url) {
      throw new Error('Failed to generate or edit thumbnail.');
    }

    return { editedThumbnail: media.url };
  }
);
