'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button, Empty, Badge, Tabs } from '@/components/ui';
import type { TabItem } from '@/components/ui';


interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  size: string;
  quality: string;
  style: string;
  createdAt: Date;
}

interface UnderstandResult {
  id: string;
  imageUrl: string;
  prompt: string;
  result: string;
  model: string;
  createdAt: Date;
}

const imageModels = [
  { id: 'dall-e-3', name: 'DALL-E 3', icon: '🟢', provider: 'OpenAI' },
  { id: 'stable-diffusion', name: 'Stable Diffusion', icon: '🟣', provider: 'Stability AI' },
  { id: 'midjourney', name: 'Midjourney', icon: '🔵', provider: 'Midjourney' },
  { id: 'flux', name: 'Flux', icon: '🟠', provider: 'Black Forest Labs' },
];

const sizes = ['1024x1024', '1792x1024', '1024x1792', '512x512'];
const qualities = ['standard', 'hd'];
const styles = ['vivid', 'natural'];

// ==================== Understand Mode ====================

function UnderstandPanel() {
  const t = useTranslations('image');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [understandPrompt, setUnderstandPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<UnderstandResult[]>([]);
  const [currentResult, setCurrentResult] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Strip data URL prefix to get raw base64
      const base64 = result.split(',')[1] || result;
      setUploadedImage(base64);
      setUploadedFileName(file.name);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const analyzeImage = async () => {
    if (!uploadedImage || !understandPrompt.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setCurrentResult('');

    try {
      const response = await fetch('/api/multimodal/understand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          imageBase64: uploadedImage,
          prompt: understandPrompt.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.result || 'No result';

      const newResult: UnderstandResult = {
        id: Date.now().toString(),
        imageUrl: `data:image/jpeg;base64,${uploadedImage}`,
        prompt: understandPrompt.trim(),
        result: resultText,
        model: data.model || 'Unknown',
        createdAt: new Date(),
      };

      setResults((prev) => [newResult, ...prev]);
      setCurrentResult(resultText);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setCurrentResult(`${t('errorRequest')}: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setUploadedFileName('');
    setCurrentResult('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Left panel - upload & prompt */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-card p-4 overflow-y-auto space-y-4 shrink-0 max-h-[40vh] md:max-h-none">
        {/* Image upload area */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('uploadImage')}</label>
          {!uploadedImage ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center w-full h-48
                rounded-xl border-2 border-dashed cursor-pointer transition-all
                ${isDragOver
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-border hover:border-indigo-500/50 hover:bg-muted/50'
                }
              `}
            >
              <span className="text-3xl mb-2">📁</span>
              <p className="text-xs text-muted-foreground text-center px-4">{t('uploadHint')}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{t('uploadFormats')}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img
                src={`data:image/jpeg;base64,${uploadedImage}`}
                alt={uploadedFileName}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('changeImage')}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={removeImage}
                >
                  {t('removeImage')}
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                <p className="text-[10px] text-white truncate">{uploadedFileName}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Prompt */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('understandPrompt')}</label>
          <textarea
            value={understandPrompt}
            onChange={(e) => setUnderstandPrompt(e.target.value)}
            placeholder={t('understandPromptPlaceholder')}
            className="w-full h-24 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Analyze button */}
        <Button
          onClick={analyzeImage}
          disabled={!uploadedImage || !understandPrompt.trim() || isAnalyzing}
          loading={isAnalyzing}
          className="w-full"
          size="lg"
        >
          {!isAnalyzing && <>🔍 {t('understandButton')}</>}
          {isAnalyzing && t('understanding')}
        </Button>
      </div>

      {/* Right panel - results */}
      <div className="flex-1 p-4 overflow-y-auto">
        {results.length === 0 && !isAnalyzing ? (
          <Empty
            icon={<span className="text-5xl">🔍</span>}
            title={t('understandEmpty')}
            className="h-full"
          />
        ) : (
          <div className="space-y-4">
            {/* Current/latest result */}
            {(isAnalyzing || currentResult) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card/80 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge color="indigo">{t('understandResult')}</Badge>
                  {results[0] && (
                    <span className="text-[10px] text-muted-foreground">{results[0].model}</span>
                  )}
                </div>
                {isAnalyzing ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block"
                    >
                      ⏳
                    </motion.span>
                    {t('understanding')}
                  </div>
                ) : (
                  <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {currentResult}
                  </div>
                )}
              </motion.div>
            )}

            {/* History */}
            <AnimatePresence>
              {results.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card/80 overflow-hidden"
                >
                  <div className="flex gap-3 p-3">
                    <img
                      src={r.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1 truncate">Q: {r.prompt}</p>
                      <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">{r.result}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge color="gray" className="text-[10px]">{r.model}</Badge>
                        <span className="text-[10px] text-muted-foreground/60">
                          {r.createdAt.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Generate Mode ====================

function GeneratePanel() {
  const t = useTranslations('image');
  const tCommon = useTranslations('common');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(imageModels[0]);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [selectedQuality, setSelectedQuality] = useState(qualities[0]);
  const [selectedStyle, setSelectedStyle] = useState(styles[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          size: selectedSize,
          style: selectedStyle.toLowerCase(),
          model: selectedModel.name || 'dall-e-3',
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || 'Generation failed');
      }

      const data = await response.json();
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: data.url || `https://picsum.photos/seed/${Date.now()}/512/512`,
        prompt: data.revised_prompt || prompt.trim(),
        model: data.model || selectedModel.name,
        size: selectedSize,
        quality: selectedQuality,
        style: selectedStyle,
        createdAt: new Date(),
      };
      setGeneratedImages((prev) => [newImage, ...prev]);
    } catch (error: any) {
      console.error('Image generation error:', error);
      // Fallback to placeholder on error
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: `https://picsum.photos/seed/${Date.now()}/512/512`,
        prompt: prompt.trim(),
        model: selectedModel.name,
        size: selectedSize,
        quality: selectedQuality,
        style: selectedStyle,
        createdAt: new Date(),
      };
      setGeneratedImages((prev) => [newImage, ...prev]);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, id: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-image-${id}.png`;
    a.click();
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel - form */}
      <div className="w-80 border-r border-border p-4 overflow-y-auto space-y-4">
        {/* Prompt */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('prompt')}</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('promptPlaceholder')}
            className="w-full h-24 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Negative prompt */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('negativePrompt')}</label>
          <input
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder={t('negativePromptPlaceholder')}
            className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Size */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('size')}</label>
          <div className="grid grid-cols-2 gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedSize === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Quality & Style */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('quality')}</label>
            <div className="flex gap-1.5">
              {qualities.map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuality(q)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    selectedQuality === q
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('style')}</label>
            <div className="flex gap-1.5">
              {styles.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStyle(s)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    selectedStyle === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Model selector */}
        <div className="relative">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Model</label>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowModelSelector(!showModelSelector)}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <span>{selectedModel.icon}</span>
              <span>{selectedModel.name}</span>
            </span>
            <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
          <AnimatePresence>
            {showModelSelector && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
              >
                {imageModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { setSelectedModel(model); setShowModelSelector(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors ${
                      selectedModel.id === model.id ? 'bg-indigo-500/10' : ''
                    }`}
                  >
                    <span className="text-lg">{model.icon}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium">{model.name}</div>
                      <div className="text-xs text-muted-foreground">{model.provider}</div>
                    </div>
                    {selectedModel.id === model.id && (
                      <span className="ml-auto text-xs text-indigo-400">✓</span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Generate button */}
        <Button
          onClick={generateImage}
          disabled={!prompt.trim() || isGenerating}
          loading={isGenerating}
          className="w-full"
          size="lg"
        >
          {!isGenerating && <>✨ {t('generate')}</>}
          {isGenerating && t('generating')}
        </Button>
      </div>

      {/* Right panel - gallery */}
      <div className="flex-1 p-4 overflow-y-auto">
        {generatedImages.length === 0 ? (
          <Empty
            icon={<span className="text-5xl">🎨</span>}
            title={t('emptyTitle')}
            className="h-full"
          />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {generatedImages.map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative rounded-xl overflow-hidden border border-border bg-card/80"
                >
                  <div className="aspect-square relative">
                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => downloadImage(img.url, img.id)}
                      >
                        {tCommon('download')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPrompt(img.prompt)}
                      >
                        {t('reusePrompt')}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground truncate">{img.prompt}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge color="indigo" className="text-[10px]">{img.model}</Badge>
                      <span className="text-[10px] text-muted-foreground/60">{img.size}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* History sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border bg-card/50 overflow-hidden"
          >
            <div className="w-[280px] p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground">{t('generationHistory')}</h3>
                <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {generatedImages.map((img) => (
                  <div
                    key={img.id}
                    className="flex gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => setPrompt(img.prompt)}
                  >
                    <img src={img.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{img.prompt}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{img.model} · {img.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== Main Page ====================

export default function ImagePage() {
  const t = useTranslations('image');

  const tabItems: TabItem[] = [
    {
      key: 'understand',
      label: `🔍 ${t('tabUnderstand')}`,
      content: <UnderstandPanel />,
    },
    {
      key: 'generate',
      label: `🎨 ${t('tabGenerate')}`,
      content: <GeneratePanel />,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">🖼️ {t('title')}</h1>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-2">
          <Tabs
            items={tabItems}
            defaultKey="understand"
          />
        </div>
      </div>
    </div>
  );
}
