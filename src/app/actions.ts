'use server';

import {
  generateThumbnailFromPrompt,
  type GenerateThumbnailFromPromptInput,
} from '@/ai/flows/generate-thumbnail-from-prompt';
import {
  iterativelyEditThumbnail,
  type IterativelyEditThumbnailInput,
} from '@/ai/flows/iteratively-edit-thumbnail';
import {
  optimizePrompt,
  type OptimizePromptInput,
} from '@/ai/flows/optimize-prompt';
import {
  batchGenerateThumbnails,
  type BatchGenerateInput,
} from '@/ai/flows/batch-generate-thumbnails';
import {
  intelligentFusion,
  type IntelligentFusionInput,
} from '@/ai/flows/intelligent-fusion';

export async function optimizePromptAction(input: OptimizePromptInput) {
  try {
    const result = await optimizePrompt(input);
    return {success: true, optimizedPrompt: result.optimizedPrompt};
  } catch (error) {
    console.error('Error optimizing prompt:', error);
    return {success: false, error: (error as Error).message};
  }
}

export async function generateThumbnailAction(
  input: GenerateThumbnailFromPromptInput
) {
  try {
    const result = await generateThumbnailFromPrompt(input);
    return {success: true, thumbnail: result.thumbnail};
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return {success: false, error: (error as Error).message};
  }
}

export async function editThumbnailAction(
  input: IterativelyEditThumbnailInput
) {
  try {
    const result = await iterativelyEditThumbnail(input);
    return {success: true, thumbnail: result.editedThumbnail};
  } catch (error) {
    console.error('Error editing thumbnail:', error);
    return {success: false, error: (error as Error).message};
  }
}

export async function batchGenerateAction(input: BatchGenerateInput) {
  try {
    const result = await batchGenerateThumbnails(input);
    return {success: true, ...result};
  } catch (error) {
    console.error('Error in batch generation:', error);
    return {success: false, error: (error as Error).message};
  }
}

export async function intelligentFusionAction(input: IntelligentFusionInput) {
  try {
    const result = await intelligentFusion(input);
    return {success: true, ...result};
  } catch (error) {
    console.error('Error in intelligent fusion:', error);
    return {success: false, error: (error as Error).message};
  }
}
