import { config } from 'dotenv';
config();

import '@/ai/flows/generate-thumbnail-from-prompt.ts';
import '@/ai/flows/iteratively-edit-thumbnail.ts';
import '@/ai/flows/optimize-prompt.ts';
import '@/ai/flows/batch-generate-thumbnails.ts';
import '@/ai/flows/intelligent-fusion.ts';
