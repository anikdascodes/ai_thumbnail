'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating thumbnails from a text prompt and uploaded images.
 *
 * - generateThumbnailFromPrompt - A function that accepts a prompt and images and returns a generated thumbnail.
 * - GenerateThumbnailFromPromptInput - The input type for the generateThumbnailFromPrompt function.
 * - GenerateThumbnailFromPromptOutput - The return type for the generateThumbnailFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateThumbnailFromPromptInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the desired thumbnail design.'),
  image1: z
    .string()
    .describe(
      "First image to include in the thumbnail generation, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
  image2: z
    .string()
    .describe(
      "Second image to include in the thumbnail generation, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
  image3: z
    .string()
    .describe(
      "Third image to include in the thumbnail generation, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
  aspectRatio: z
    .enum(['16:9', '9:16', '1:1'])
    .describe('The desired aspect ratio for the thumbnail.'),
});

export type GenerateThumbnailFromPromptInput = z.infer<
  typeof GenerateThumbnailFromPromptInputSchema
>;

const GenerateThumbnailFromPromptOutputSchema = z.object({
  thumbnail: z
    .string()
    .describe(
      'The generated thumbnail image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // escaped characters
    ),
});

export type GenerateThumbnailFromPromptOutput = z.infer<
  typeof GenerateThumbnailFromPromptOutputSchema
>;

export async function generateThumbnailFromPrompt(
  input: GenerateThumbnailFromPromptInput
): Promise<GenerateThumbnailFromPromptOutput> {
  return generateThumbnailFromPromptFlow(input);
}

const generateThumbnailFromPromptFlow = ai.defineFlow(
  {
    name: 'generateThumbnailFromPromptFlow',
    inputSchema: GenerateThumbnailFromPromptInputSchema,
    outputSchema: GenerateThumbnailFromPromptOutputSchema,
  },
  async input => {
    const mediaParts: { media: { url: string } }[] = [];

    if (input.image1) {
      mediaParts.push({ media: { url: input.image1 } });
    }
    if (input.image2) {
      mediaParts.push({ media: { url: input.image2 } });
    }
    if (input.image3) {
      mediaParts.push({ media: { url: input.image3 } });
    }

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      system: `You are an expert image generator.
${input.aspectRatio === '9:16'
  ? 'You MUST generate an image with an aspect ratio of EXACTLY 9:16 (vertical). Do not add any padding or black bars. Do NOT crop or cut any text or subjects; instead, scale and reposition elements so that all content remains fully inside the 9:16 frame with comfortable safe margins.'
  : `You MUST generate an image with an aspect ratio of EXACTLY ${input.aspectRatio}. Do not add any padding or black bars. Crop the image to fit the requested aspect ratio if necessary.`}
`,
      prompt: [
        ...mediaParts,
        {
          text: `User prompt: ${input.prompt}`,
        },
      ],
    });

    if (!media?.url) {
      throw new Error('Image generation did not return an image.');
    }

    return {thumbnail: media.url};
  }
);
