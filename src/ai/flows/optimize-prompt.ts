'use server';

/**
 * @fileOverview This file defines a Genkit flow for optimizing a user's prompt for image generation.
 *
 * @exports optimizePrompt - A function that takes a user's prompt and other parameters and returns an optimized prompt.
 * @exports OptimizePromptInput - The input type for the optimizePrompt function.
 * @exports OptimizePromptOutput - The output type for the optimizePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizePromptInputSchema = z.object({
  prompt: z.string().describe("The user's original prompt."),
  aspectRatio: z
    .enum(['16:9', '9:16', '1:1'])
    .describe('The desired aspect ratio.'),
  image1: z.string().optional(),
  image2: z.string().optional(),
  image3: z.string().optional(),
});
export type OptimizePromptInput = z.infer<typeof OptimizePromptInputSchema>;

const OptimizePromptOutputSchema = z.object({
  optimizedPrompt: z
    .string()
    .describe('The optimized prompt for the image generation model.'),
});
export type OptimizePromptOutput = z.infer<typeof OptimizePromptOutputSchema>;

export async function optimizePrompt(
  input: OptimizePromptInput
): Promise<OptimizePromptOutput> {
  return optimizePromptFlow(input);
}

const optimizePromptFlow = ai.defineFlow(
  {
    name: 'optimizePromptFlow',
    inputSchema: OptimizePromptInputSchema,
    outputSchema: OptimizePromptOutputSchema,
  },
  async input => {
    const imageParts = [input.image1, input.image2, input.image3]
      .filter(Boolean)
      .map(url => ({ media: { url: url! } }));
    const providedImagesCount = imageParts.length;
    const assetContext = providedImagesCount
      ? `The user also provided ${providedImagesCount} reference image${providedImagesCount > 1 ? 's' : ''}. Consider them when composing the scene.`
      : 'No reference images were provided.';

    let response;
    try {
      const ratioRule =
        input.aspectRatio === '9:16'
          ? `The final image MUST have an aspect ratio of exactly 9:16 (vertical). Do not add any padding or black bars. Do NOT crop or cut any text or subjects; instead, scale and reposition elements so that all content remains fully inside the 9:16 frame with comfortable safe margins.`
          : `The final image MUST have an aspect ratio of exactly ${input.aspectRatio}. Do not add any padding or black bars. Crop the image to fit the requested aspect ratio if necessary.`;

      response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        system: `You are an expert prompt engineer for a text-to-image model. Your task is to take a user's simple prompt and expand it into a rich, detailed, and creative prompt that will generate a visually stunning and effective thumbnail.

You must follow these rules:
1.  **Incorporate Aspect Ratio**: ${ratioRule}
2.  **Describe Composition**: Detail the layout, including subject placement, background elements, and foreground details. Use terms like "rule of thirds," "leading lines," "depth of field," etc.
3.  **Specify Style**: Define the artistic style. Examples: "hyper-realistic photo," "cinematic 4k," "digital painting," "anime style," "vibrant illustration," "dramatic lighting."
4.  **Enhance Details**: Add specific details about colors, lighting, textures, and mood. Be descriptive and evocative.
5.  **Incorporate User Images**: If the user has provided reference images, your prompt should instruct the image model to incorporate them creatively into the final composition.
6.  **Keep it a single paragraph. Do not use lists or bullet points.**
7.  **Output only the prompt itself, with no extra text or explanation.**`,
        prompt: [
          ...imageParts,
          { text: `User prompt: "${input.prompt}"\nAspect ratio: ${input.aspectRatio}\n${assetContext}` },
        ],
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('optimizePrompt: model call failed', error);
      const fallback = `Create an eye-catching thumbnail. Aspect ratio: ${input.aspectRatio}. Crop to fit with no padding or black bars. Emphasize strong composition (rule of thirds, leading lines), clear subject separation, and dramatic lighting. Reflect the following intent: ${input.prompt}. ${providedImagesCount ? 'Incorporate the provided reference images appropriately.' : ''}`.trim();
      return { optimizedPrompt: fallback };
    }

    const finalText = response.text || response.output?.text;
    if (!finalText) {
      // Helpful diagnostics for server logs
      // eslint-disable-next-line no-console
      console.error('optimizePrompt: empty response from model', {
        finishReason: (response as any).finishReason,
        finishMessage: (response as any).finishMessage,
      });
      // Fallback: construct a safe optimized prompt so the UX continues
      const fallback = `Create an eye-catching thumbnail. Aspect ratio: ${input.aspectRatio}. Crop to fit with no padding or black bars. Emphasize strong composition (rule of thirds, leading lines), clear subject separation, and dramatic lighting. Reflect the following intent: ${input.prompt}. ${providedImagesCount ? 'Incorporate the provided reference images appropriately.' : ''}`.trim();
      return { optimizedPrompt: fallback };
    }

    return {optimizedPrompt: finalText};
  }
);
