'use server';

/**
 * @fileOverview Advanced batch generation flow leveraging Gemini 2.5 Flash Image consistency features.
 *
 * @exports batchGenerateThumbnails - Generate multiple consistent thumbnails
 * @exports BatchGenerateInput - Input type for batch generation
 * @exports BatchGenerateOutput - Output type for batch generation
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BatchGenerateInputSchema = z.object({
  prompts: z.array(z.string()).describe('Array of prompts for batch generation.'),
  basePrompt: z.string().describe('Base prompt for consistency across all generations.'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).describe('Aspect ratio for all thumbnails.'),
  styleReference: z.string().optional().describe('Reference image for style consistency.'),
  characterReference: z.string().optional().describe('Reference image for character consistency.'),
  consistencyMode: z.enum(['character', 'style', 'theme', 'none']).describe('Type of consistency to maintain.'),
});

export type BatchGenerateInput = z.infer<typeof BatchGenerateInputSchema>;

const BatchGenerateOutputSchema = z.object({
  thumbnails: z.array(z.object({
    image: z.string().describe('Generated thumbnail as data URI.'),
    prompt: z.string().describe('The prompt used for this thumbnail.'),
    index: z.number().describe('Index in the batch.'),
  })).describe('Array of generated thumbnails with metadata.'),
  consistency_score: z.number().optional().describe('Estimated consistency score across batch.'),
});

export type BatchGenerateOutput = z.infer<typeof BatchGenerateOutputSchema>;

export async function batchGenerateThumbnails(
  input: BatchGenerateInput
): Promise<BatchGenerateOutput> {
  return batchGenerateFlow(input);
}

const batchGenerateFlow = ai.defineFlow(
  {
    name: 'batchGenerateFlow',
    inputSchema: BatchGenerateInputSchema,
    outputSchema: BatchGenerateOutputSchema,
  },
  async input => {
    const thumbnails = [];
    
    // Build consistency prompt based on mode
    let consistencyInstruction = '';
    const referenceImages = [];
    
    if (input.consistencyMode === 'character' && input.characterReference) {
      consistencyInstruction = ' CRITICAL: Maintain exact character consistency - same facial features, hair, clothing style, and character design as shown in the reference image. The character should be immediately recognizable across all variations.';
      referenceImages.push({ media: { url: input.characterReference } });
    } else if (input.consistencyMode === 'style' && input.styleReference) {
      consistencyInstruction = ' CRITICAL: Apply the exact artistic style, color palette, lighting technique, brushwork, and visual treatment from the reference image to create a cohesive series.';
      referenceImages.push({ media: { url: input.styleReference } });
    } else if (input.consistencyMode === 'theme') {
      consistencyInstruction = ' CRITICAL: Maintain thematic consistency - same mood, color scheme, composition style, and visual hierarchy across all thumbnails in this series.';
    }

    // Generate thumbnails with enhanced consistency
    for (let i = 0; i < input.prompts.length; i++) {
      const prompt = input.prompts[i];
      
      // Enhanced prompt with consistency and fusion instructions
      const enhancedPrompt = `${input.basePrompt} ${prompt}${consistencyInstruction} 
      
      TECHNICAL REQUIREMENTS:
      - Aspect ratio: exactly ${input.aspectRatio}
      - Professional thumbnail quality with high visual impact
      - Clear focal point and readable text elements
      - Consistent branding and style throughout the series
      - Optimized for ${input.aspectRatio === '16:9' ? 'YouTube thumbnails' : input.aspectRatio === '9:16' ? 'vertical social media' : 'square social posts'}`;

      try {
        const {media} = await ai.generate({
          model: 'googleai/gemini-2.5-flash-image-preview',
          system: `You are an expert thumbnail designer specializing in creating consistent, high-impact visual series. You excel at maintaining visual consistency across multiple designs while ensuring each thumbnail is unique and engaging.

${input.aspectRatio === '9:16'
  ? 'Generate vertical 9:16 thumbnails. Keep all text and visual elements fully inside the frame with comfortable safe margins. Do NOT crop or cut any content; instead, scale and reposition elements to fit the vertical format.'
  : `Generate thumbnails with exact aspect ratio ${input.aspectRatio}. Ensure all elements fit properly within the frame.`}

Focus on:
- Visual consistency ${input.consistencyMode !== 'none' ? `(${input.consistencyMode} consistency is CRITICAL)` : ''}
- High contrast and readability
- Professional design quality
- Thumbnail-optimized composition
- Clear visual hierarchy`,
          prompt: [
            ...referenceImages,
            { text: enhancedPrompt },
          ],
        });

        if (media?.url) {
          thumbnails.push({
            image: media.url,
            prompt: prompt,
            index: i,
          });
        }
      } catch (error) {
        console.error(`Batch generation failed for prompt ${i}:`, error);
        // Continue with other prompts even if one fails
      }
    }

    return {
      thumbnails,
      consistency_score: thumbnails.length / input.prompts.length, // Simple consistency metric
    };
  }
);


