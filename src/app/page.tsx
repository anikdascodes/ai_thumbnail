'use client';

import {useState, useMemo, useCallback, type ChangeEvent} from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  X,
  Wand2,
  Loader2,
  Edit,
  Sparkles,
  Download,
  Image as ImageIcon,
  ChevronRight,
  ArrowRight,
  History,
  Palette,
  Users,
  Copy,
  RefreshCw,
} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {useToast} from '@/hooks/use-toast';
import {
  generateThumbnailAction,
  editThumbnailAction,
  optimizePromptAction,
} from './actions';
import type {GenerateThumbnailFromPromptInput} from '@/ai/flows/generate-thumbnail-from-prompt';
import {cn} from '@/lib/utils';
import {Badge} from '@/components/ui/badge';

const MAX_IMAGES = 3;

export default function AIPage() {
  const {toast} = useToast();

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [optimizedPrompt, setOptimizedPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] =
    useState<GenerateThumbnailFromPromptInput['aspectRatio']>('1:1');
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(
    null
  );
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [generationHistory, setGenerationHistory] = useState<Array<{
    prompt: string;
    image: string;
    timestamp: number;
    aspectRatio: string;
  }>>([]);
  const [selectedStyleReference, setSelectedStyleReference] = useState<string>('');
  const [consistencyMode, setConsistencyMode] = useState<'character' | 'style' | 'none'>('none');
  const [batchCount, setBatchCount] = useState<number>(1);
  const [currentVariation, setCurrentVariation] = useState<number>(0);

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        const files = Array.from(event.target.files);
        const remainingSlots = MAX_IMAGES - uploadedImages.length;
        if (files.length > remainingSlots) {
          toast({
            variant: 'destructive',
            title: 'Too many images',
            description: `You can only upload up to ${MAX_IMAGES} images in total.`,
          });
          return;
        }

        try {
          const dataUris = await Promise.all(files.map(fileToDataUri));
          setUploadedImages(prev => [...prev, ...dataUris]);
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Image Upload Failed',
            description: 'There was an error reading one of the files.',
          });
        }
      }
    },
    [uploadedImages.length, toast]
  );

  const handleRemoveImage = useCallback((index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleOptimizePrompt = async () => {
    if (!prompt) {
      toast({
        variant: 'destructive',
        title: 'Missing Prompt',
        description: 'Please provide a prompt to optimize.',
      });
      return;
    }
    setIsOptimizing(true);
    setOptimizedPrompt('');
    setGeneratedThumbnail(null);

    const result = await optimizePromptAction({
      prompt,
      aspectRatio,
      image1: uploadedImages[0],
      image2: uploadedImages[1],
      image3: uploadedImages[2],
    });

    if (result.success) {
      setOptimizedPrompt(result.optimizedPrompt);
    } else {
      toast({
        variant: 'destructive',
        title: 'Optimization Failed',
        description:
          result.error || 'An unexpected error occurred. Please try again.',
      });
    }
    setIsOptimizing(false);
  };

  const handleGenerate = async () => {
    if (!optimizedPrompt) {
      toast({
        variant: 'destructive',
        title: 'Missing Optimized Prompt',
        description: 'Please optimize a prompt before generating.',
      });
      return;
    }
    setIsLoading(true);
    setGeneratedThumbnail(null);

    // Enhanced prompt with consistency and fusion features
    let enhancedPrompt = optimizedPrompt;
    
    if (consistencyMode === 'character' && selectedStyleReference) {
      enhancedPrompt += ' Maintain character consistency with the reference image provided. Keep the same facial features, clothing style, and character design throughout.';
    } else if (consistencyMode === 'style' && selectedStyleReference) {
      enhancedPrompt += ' Apply the artistic style, color palette, lighting, and visual treatment from the reference image while creating new content.';
    }

    const input: GenerateThumbnailFromPromptInput = {
      prompt: enhancedPrompt,
      aspectRatio,
      image1: selectedStyleReference || uploadedImages[0],
      image2: uploadedImages[1],
      image3: uploadedImages[2],
    };

    const result = await generateThumbnailAction(input);
    if (result.success) {
      setGeneratedThumbnail(result.thumbnail);
      // Add to history for consistency tracking
      setGenerationHistory(prev => [...prev, {
        prompt: optimizedPrompt,
        image: result.thumbnail,
        timestamp: Date.now(),
        aspectRatio
      }]);
    } else {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description:
          result.error || 'An unexpected error occurred. Please try again.',
      });
    }
    setIsLoading(false);
  };

  const handleEdit = async () => {
    if (!editPrompt || !generatedThumbnail) {
      toast({
        variant: 'destructive',
        title: 'Missing Edit Prompt',
        description: 'Please describe the changes you want to make.',
      });
      return;
    }
    setIsEditing(true);

    const result = await editThumbnailAction({
      baseImage: generatedThumbnail,
      prompt: editPrompt,
      aspectRatio,
    });

    if (result.success) {
      setGeneratedThumbnail(result.thumbnail);
      setEditPrompt('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Edit Failed',
        description:
          result.error || 'An unexpected error occurred. Please try again.',
      });
    }
    setIsEditing(false);
  };

  const handleDownload = () => {
    if (!generatedThumbnail) return;
    const link = document.createElement('a');
    link.href = generatedThumbnail;
    const fileExtension =
      generatedThumbnail.split(';')[0].split('/')[1] || 'png';
    link.download = `thumbnail-${Date.now()}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imageInputKey = useMemo(
    () => uploadedImages.join('-'),
    [uploadedImages]
  );
  const aspectRatioClass = useMemo(() => {
    if (aspectRatio === '16:9') return 'aspect-[16/9]';
    if (aspectRatio === '9:16') return 'aspect-[9/16]';
    return 'aspect-square';
  }, [aspectRatio]);

  const allDisabled = isLoading || isEditing || isOptimizing;

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="font-headline text-xl font-bold tracking-tighter sm:text-2xl">
            AI Thumbcraft
          </h1>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col p-4 sm:p-6 lg:p-8 border-r">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Create your thumbnail
              </h2>
              <p className="text-muted-foreground">
                Design the perfect thumbnail with the power of AI.
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                1. Upload assets & references
              </Label>
              <div className="flex gap-2 mb-3">
                <Button
                  variant={consistencyMode === 'none' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setConsistencyMode('none')}
                >
                  <ImageIcon className="w-4 h-4 mr-1" />
                  Assets
                </Button>
                <Button
                  variant={consistencyMode === 'character' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setConsistencyMode('character')}
                >
                  <Users className="w-4 h-4 mr-1" />
                  Character
                </Button>
                <Button
                  variant={consistencyMode === 'style' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setConsistencyMode('style')}
                >
                  <Palette className="w-4 h-4 mr-1" />
                  Style
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {uploadedImages.map((src, index) => (
                  <div
                    key={index}
                    className="group relative aspect-video overflow-hidden rounded-lg border"
                  >
                    <Image
                      src={src}
                      alt={`Uploaded image ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100" />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 transition-all group-hover:opacity-100 hover:scale-110"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {uploadedImages.length < MAX_IMAGES && (
                  <Label
                    htmlFor="image-upload"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors hover:border-primary hover:bg-accent"
                  >
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-semibold text-muted-foreground">
                      Upload
                    </span>
                  </Label>
                )}
              </div>
              <Input
                id="image-upload"
                key={imageInputKey}
                type="file"
                className="sr-only"
                multiple
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange}
                disabled={allDisabled}
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="prompt" className="text-lg font-semibold">
                2. Describe your design
              </Label>
              <Textarea
                id="prompt"
                placeholder="e.g., A vibrant, eye-catching thumbnail with a shocked face emoji, bold yellow text 'YOU WON'T BELIEVE THIS!'..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={5}
                className="text-base"
                disabled={allDisabled}
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="aspect-ratio" className="text-lg font-semibold">
                3. Choose aspect ratio
              </Label>
              <Select
                value={aspectRatio}
                onValueChange={value =>
                  setAspectRatio(value as '16:9' | '9:16' | '1:1')
                }
                disabled={allDisabled}
              >
                <SelectTrigger id="aspect-ratio" className="text-base h-12">
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 - Widescreen (YouTube)</SelectItem>
                  <SelectItem value="9:16">9:16 - Vertical (Shorts, Reels)</SelectItem>
                  <SelectItem value="1:1">1:1 - Square (Instagram)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold flex items-center gap-2">
                4. Optimize Prompt with AI
              </Label>
              <Button
                onClick={handleOptimizePrompt}
                disabled={allDisabled || !prompt}
                className="w-full text-lg h-14"
                size="lg"
                variant="outline"
              >
                {isOptimizing ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-6 w-6" />
                )}
                Optimize Prompt
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {optimizedPrompt && (
              <div className="space-y-4">
                <Label
                  htmlFor="optimized-prompt"
                  className="text-lg font-semibold"
                >
                  Optimized Prompt
                </Label>
                <Textarea
                  id="optimized-prompt"
                  value={optimizedPrompt}
                  onChange={e => setOptimizedPrompt(e.target.value)}
                  rows={6}
                  className="text-base bg-muted/30"
                  disabled={allDisabled}
                />
                <Button
                  onClick={handleGenerate}
                  disabled={allDisabled || !optimizedPrompt}
                  className="w-full text-lg h-14"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-6 w-6" />
                  )}
                  Generate Thumbnail
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col bg-muted/20 p-4 sm:p-6 lg:p-8">
          <div className="flex-grow flex flex-col items-center justify-center gap-4">
            <div
              className={cn(
                'relative w-full rounded-xl overflow-hidden shadow-2xl shadow-primary/10 border-2 border-dashed flex items-center justify-center',
                aspectRatioClass,
                aspectRatio === '9:16' ? 'max-w-sm' : 'max-w-2xl'
              )}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 text-muted-foreground p-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="font-semibold text-lg">
                    Generating your masterpiece...
                  </p>
                  <p className="text-sm text-center">
                    This can take up to 30 seconds.
                  </p>
                </div>
              ) : generatedThumbnail ? (
                <Image
                  src={generatedThumbnail}
                  alt="Generated thumbnail"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted-foreground p-8">
                  <ImageIcon className="h-16 w-16" />
                  <p className="font-medium text-lg">
                    Your thumbnail will appear here
                  </p>
                   {isOptimizing && (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="font-semibold text-base">Optimizing prompt...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {generatedThumbnail && !isLoading && (
              <div className="w-full max-w-2xl space-y-4 mt-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-prompt"
                    className="font-semibold flex items-center gap-2 text-base"
                  >
                    <Edit className="w-5 h-5" />
                    Refine with AI
                  </Label>
                  <Textarea
                    id="edit-prompt"
                    placeholder="e.g., 'Make the text bigger', 'Change the background to blue', 'Add more dramatic lighting'..."
                    value={editPrompt}
                    onChange={e => setEditPrompt(e.target.value)}
                    rows={2}
                    className="text-base"
                    disabled={isEditing || isLoading}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    onClick={handleEdit}
                    disabled={isEditing || isLoading || !editPrompt}
                    variant="secondary"
                    className="h-11 text-sm"
                  >
                    {isEditing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    Refine
                  </Button>
                  <Button
                    onClick={() => setSelectedStyleReference(generatedThumbnail!)}
                    disabled={isLoading}
                    variant="outline"
                    className="h-11 text-sm"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Use Style
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading || !optimizedPrompt}
                    variant="outline"
                    className="h-11 text-sm"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Variation
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="h-11 text-sm bg-primary hover:bg-primary/90"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            )}

            {/* Generation History */}
            {generationHistory.length > 0 && (
              <div className="w-full max-w-2xl mt-8">
                <Label className="font-semibold flex items-center gap-2 text-base mb-4">
                  <History className="w-5 h-5" />
                  Generation History
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {generationHistory.slice(-6).map((item, index) => (
                    <div
                      key={item.timestamp}
                      className="group relative aspect-square overflow-hidden rounded-lg border cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedStyleReference(item.image)}
                    >
                      <Image
                        src={item.image}
                        alt={`Generated ${index + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-1 left-1 right-1">
                        <Badge variant="secondary" className="text-xs truncate">
                          {item.aspectRatio}
                        </Badge>
                      </div>
                      {selectedStyleReference === item.image && (
                        <div className="absolute top-1 right-1">
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
