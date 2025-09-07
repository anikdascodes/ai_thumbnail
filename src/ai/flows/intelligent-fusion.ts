'use server';

/**
 * @fileOverview Intelligent image fusion flow leveraging Gemini 2.5 Flash Image's advanced multimodal capabilities.
 *
 * @exports intelligentFusion - Fuse multiple images with AI-guided composition
 * @exports IntelligentFusionInput - Input type for fusion
 * @exports IntelligentFusionOutput - Output type for fusion
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentFusionInputSchema = z.object({
  images: z.array(z.string()).min(2).max(4).describe('Images to fuse together (2-4 images).'),
  fusionPrompt: z.string().describe('Description of how to combine the images.'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).describe('Target aspect ratio.'),
  fusionStyle: z.enum(['seamless', 'collage', 'overlay', 'blend', 'composite']).describe('Fusion technique to use.'),
  dominantImage: z.number().optional().describe('Index of image that should be dominant (0-based).'),
  creativityLevel: z.enum(['conservative', 'balanced', 'creative', 'experimental']).describe('How creative the fusion should be.'),
});

export type IntelligentFusionInput = z.infer<typeof IntelligentFusionInputSchema>;

const IntelligentFusionOutputSchema = z.object({
  fusedImage: z.string().describe('The fused image as data URI.'),
  fusionDescription: z.string().describe('Description of how the images were combined.'),
  technicalDetails: z.object({
    primaryElements: z.array(z.string()).describe('Key elements from each source image.'),
    fusionTechnique: z.string().describe('The technique used for fusion.'),
    aspectRatioHandling: z.string().describe('How aspect ratio was maintained.'),
  }).describe('Technical details about the fusion process.'),
});

export type IntelligentFusionOutput = z.infer<typeof IntelligentFusionOutputSchema>;

export async function intelligentFusion(
  input: IntelligentFusionInput
): Promise<IntelligentFusionOutput> {
  return intelligentFusionFlow(input);
}

const intelligentFusionFlow = ai.defineFlow(
  {
    name: 'intelligentFusionFlow',
    inputSchema: IntelligentFusionInputSchema,
    outputSchema: IntelligentFusionOutputSchema,
  },
  async input => {
    // Analyze the images first to understand their content
    const analysisPrompt = `Analyze these ${input.images.length} images and describe:
1. The main subject/content of each image
2. The artistic style and visual characteristics
3. The lighting and color palette
4. How they could be best combined for a ${input.fusionStyle} fusion
5. Potential challenges in combining them

Target fusion goal: ${input.fusionPrompt}
Creativity level: ${input.creativityLevel}`;

    const analysisResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: 'You are an expert visual analyst specializing in image composition and fusion techniques. Provide detailed, technical analysis for optimal image combination.',
      prompt: [
        ...input.images.map(url => ({ media: { url } })),
        { text: analysisPrompt },
      ],
    });

    // Generate fusion instructions based on analysis
    let fusionInstructions = '';
    switch (input.fusionStyle) {
      case 'seamless':
        fusionInstructions = 'Create a seamless blend where all images flow naturally together with smooth transitions and unified lighting.';
        break;
      case 'collage':
        fusionInstructions = 'Arrange the images in an artistic collage layout with clear boundaries but harmonious composition.';
        break;
      case 'overlay':
        fusionInstructions = 'Layer the images with creative overlays, transparency effects, and depth to create visual interest.';
        break;
      case 'blend':
        fusionInstructions = 'Blend the images together using advanced mixing techniques, creating new visual relationships between elements.';
        break;
      case 'composite':
        fusionInstructions = 'Create a professional composite combining the best elements from each image into a cohesive new design.';
        break;
    }

    // Creativity level adjustments
    let creativityInstructions = '';
    switch (input.creativityLevel) {
      case 'conservative':
        creativityInstructions = 'Maintain the original character of each image while combining them respectfully.';
        break;
      case 'balanced':
        creativityInstructions = 'Balance preservation of original elements with creative new combinations.';
        break;
      case 'creative':
        creativityInstructions = 'Take creative liberties to produce something new and visually striking.';
        break;
      case 'experimental':
        creativityInstructions = 'Push creative boundaries and experiment with unexpected combinations and effects.';
        break;
    }

    const dominantInstruction = input.dominantImage !== undefined 
      ? ` Use image ${input.dominantImage + 1} as the dominant base composition.`
      : '';

    const fusionPrompt = `${input.fusionPrompt}

FUSION SPECIFICATIONS:
- Style: ${fusionInstructions}
- Creativity: ${creativityInstructions}
- Aspect ratio: exactly ${input.aspectRatio}${dominantInstruction}
- Ensure all elements work together harmoniously
- Maintain high visual quality and professional finish

ANALYSIS CONTEXT: ${analysisResponse.text}`;

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      system: `You are a master digital artist specializing in intelligent image fusion. You excel at combining multiple images into cohesive, visually stunning compositions using advanced AI-guided techniques.

${input.aspectRatio === '9:16'
  ? 'Create a vertical 9:16 composition. Ensure all fused elements fit perfectly within the vertical frame with proper spacing and composition.'
  : `Create a composition with exact aspect ratio ${input.aspectRatio}. Optimize the layout for this specific format.`}

Your expertise includes:
- Advanced composition techniques
- Seamless element integration  
- Professional color harmony
- Visual flow and hierarchy
- Technical precision in fusion`,
      prompt: [
        ...input.images.map(url => ({ media: { url } })),
        { text: fusionPrompt },
      ],
    });

    if (!media?.url) {
      throw new Error('Intelligent fusion failed to generate image.');
    }

    return {
      fusedImage: media.url,
      fusionDescription: `Successfully fused ${input.images.length} images using ${input.fusionStyle} technique with ${input.creativityLevel} creativity level.`,
      technicalDetails: {
        primaryElements: input.images.map((_, i) => `Elements from image ${i + 1}`),
        fusionTechnique: input.fusionStyle,
        aspectRatioHandling: `Optimized for ${input.aspectRatio} format`,
      },
    };
  }
);


