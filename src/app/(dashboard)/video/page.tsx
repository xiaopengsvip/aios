'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button, Empty, Badge, Progress, LoadingSpinner, Tabs } from '@/components/ui';
import type { TabItem } from '@/components/ui';


interface GeneratedVideo {
  id: string;
  url: string;
  thumbnail: string;
  prompt: string;
  model: string;
  duration: string;
  resolution: string;
  aspectRatio: string;
  createdAt: Date;
  status: 'generating' | 'done' | 'error';
  progress: number;
}

interface UnderstandResult {
  id: string;
  fileName: string;
  prompt: string;
  result: string;
  model: string;
  createdAt: Date;
}

const videoModels = [
  { id: 'jimeng', name: '即梦AI', icon: '🟡', provider: '火山引擎 (需 AK/SK)' },
  { id: 'runway', name: 'Runway Gen-3', icon: '🔵', provider: 'Runway (需 API Key)' },
  { id: 'kling', name: 'Kling', icon: '🟡', provider: '快手 (需 API Key)' },
  { id: 'pika', name: 'Pika', icon: '🟣', provider: 'Pika Labs (需 API Key)' },
];

const durations = ['5s', '10s', '15s'];
const resolutions = ['720p', '1080p'];
const aspectRatios = ['16:9', '9:16', '1:1', '4:3'];

// ==================== Understand Mode ====================

function UnderstandPanel() {
  const t = useTranslations('video');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<UnderstandResult[]>([]);
  const [currentResult, setCurrentResult] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1] || result;
      setUploadedFile(base64);
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

  const analyzeVideo = async () => {
    if (!uploadedFile || !prompt.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setCurrentResult('');

    try {
      const response = await fetch('/api/multimodal/understand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          videoUrl: `data:video/mp4;base64,${uploadedFile}`,
          fps: 1,
          prompt: prompt.trim(),
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const resultText = data.result || 'No result';

      const newResult: UnderstandResult = {
        id: Date.now().toString(),
        fileName: uploadedFileName,
        prompt: prompt.trim(),
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

  const removeFile = () => {
    setUploadedFile(null);
    setUploadedFileName('');
    setCurrentResult('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* Left panel — mobile: top section, desktop: fixed sidebar */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-card p-4 overflow-y-auto space-y-4 shrink-0 max-h-[40vh] md:max-h-none">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('uploadVideo')}</label>
          {!uploadedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center w-full h-40
                rounded-xl border-2 border-dashed cursor-pointer transition-all
                ${isDragOver
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-border hover:border-indigo-500/50 hover:bg-muted/50'
                }
              `}
            >
              <span className="text-3xl mb-2">🎬</span>
              <p className="text-xs text-muted-foreground">{t('uploadHint')}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{t('uploadFormats')}</p>
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileInput} className="hidden" />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎬</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadedFileName}</p>
                  <p className="text-xs text-muted-foreground">已上传</p>
                </div>
                <button onClick={removeFile} className="text-xs text-red-400 hover:text-red-300">{t('removeFile')}</button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('understandPrompt')}</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('understandPromptPlaceholder')}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <Button
          onClick={analyzeVideo}
          disabled={!uploadedFile || !prompt.trim() || isAnalyzing}
          loading={isAnalyzing}
          className="w-full"
          size="lg"
        >
          {!isAnalyzing && `🎬 ${t('understandButton')}`}
          {isAnalyzing && t('understanding')}
        </Button>
      </div>

      {/* Right panel - results */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentResult ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card/80 p-6 mb-6">
            <h3 className="text-sm font-semibold mb-3">📊 {t('analyzeResult')}</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{currentResult}</p>
          </motion.div>
        ) : null}

        {results.length === 0 && !currentResult ? (
          <Empty
            icon={<span className="text-5xl">🎬</span>}
            title={t('understandEmpty')}
            message=""
          />
        ) : results.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{t('understandResult')}</h2>
            {results.map((r) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card/80 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🎬</span>
                  <span className="text-xs font-medium">{r.fileName}</span>
                  <Badge color="gray">{r.model}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{r.createdAt.toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Q: {r.prompt}</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{r.result}</p>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ==================== Generate Mode ====================

function GeneratePanel() {
  const t = useTranslations('video');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(videoModels[0]);
  const [selectedDuration, setSelectedDuration] = useState(durations[0]);
  const [selectedResolution, setSelectedResolution] = useState(resolutions[0]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatios[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const generateVideo = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenerationProgress(10);

    const videoId = Date.now().toString();
    const newVideo: GeneratedVideo = {
      id: videoId,
      url: '',
      thumbnail: `https://picsum.photos/seed/${videoId}/640/360`,
      prompt: prompt.trim(),
      model: selectedModel.name,
      duration: selectedDuration,
      resolution: selectedResolution,
      aspectRatio: selectedAspectRatio,
      createdAt: new Date(),
      status: 'generating',
      progress: 0,
    };

    setGeneratedVideos((prev) => [newVideo, ...prev]);

    try {
      setGenerationProgress(30);
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration: selectedDuration,
          resolution: selectedResolution,
          aspectRatio: selectedAspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败');

      setGenerationProgress(100);
      setGeneratedVideos((prevVideos) =>
        prevVideos.map((v) =>
          v.id === videoId
            ? { ...v, status: 'done' as const, progress: 100, url: data.video?.url || '' }
            : v
        )
      );
    } catch (e: any) {
      setGeneratedVideos((prevVideos) =>
        prevVideos.map((v) =>
          v.id === videoId ? { ...v, status: 'error' as const } : v
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="rounded-xl border border-border bg-card/80 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('prompt')}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('promptPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('duration')}</label>
                <div className="flex gap-2">
                  {durations.map((d) => (
                    <button key={d} onClick={() => setSelectedDuration(d)} className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${selectedDuration === d ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border text-muted-foreground hover:text-foreground'}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('resolution')}</label>
                <div className="flex gap-2">
                  {resolutions.map((r) => (
                    <button key={r} onClick={() => setSelectedResolution(r)} className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${selectedResolution === r ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border text-muted-foreground hover:text-foreground'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('aspectRatio')}</label>
                <div className="flex gap-2">
                  {aspectRatios.map((ar) => (
                    <button key={ar} onClick={() => setSelectedAspectRatio(ar)} className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${selectedAspectRatio === ar ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border text-muted-foreground hover:text-foreground'}`}>{ar}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Button variant="secondary" size="sm" onClick={() => setShowModelSelector(!showModelSelector)}>
                  <span>{selectedModel.icon}</span>
                  <span>{selectedModel.name}</span>
                  <span className="text-xs">▾</span>
                </Button>
                <AnimatePresence>
                  {showModelSelector && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowModelSelector(false)} />
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
                        {videoModels.map((model) => (
                          <button key={model.id} onClick={() => { setSelectedModel(model); setShowModelSelector(false); }} className={`flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-muted transition-all ${selectedModel.id === model.id ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}>
                            <span>{model.icon}</span>
                            <div className="text-left">
                              <div className="font-medium">{model.name}</div>
                              <div className="text-xs text-muted-foreground">{model.provider}</div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <Button onClick={generateVideo} disabled={!prompt.trim() || isGenerating} loading={isGenerating} className="flex-1" size="lg">
                {isGenerating ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      {t('generatingPercent', { percent: Math.round(generationProgress) })}
                    </div>
                    <Progress value={generationProgress} size="sm" />
                  </div>
                ) : (
                  `🎬 ${t('generate')}`
                )}
              </Button>
            </div>
          </div>
        </div>

        {generatedVideos.length === 0 ? (
          <Empty
            icon={<span className="text-5xl">🎬</span>}
            title={t('emptyTitle')}
            message={t('emptyDesc')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {generatedVideos.map((video) => (
              <motion.div key={video.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl overflow-hidden border border-border bg-card/80">
                <div className="aspect-video relative bg-background">
                  {video.status === 'generating' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <LoadingSpinner size="md" className="mb-4" />
                      <span className="text-sm text-muted-foreground">{t('generatingPercent', { percent: Math.round(video.progress) })}</span>
                      <div className="w-48 mt-2">
                        <Progress value={video.progress} size="sm" />
                      </div>
                    </div>
                  ) : video.status === 'done' ? (
                    <>
                      <img src={video.thumbnail} alt={video.prompt} className="w-full h-full object-cover" />
                      <button onClick={() => setPlayingVideo(playingVideo === video.id ? null : video.id)} className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-all">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                          {playingVideo === video.id ? '⏸' : '▶️'}
                        </div>
                      </button>
                      {playingVideo === video.id && (
                        <video src={video.url} autoPlay loop className="absolute inset-0 w-full h-full object-cover" />
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-red-400">⚠️ {t('generationFailed')}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm text-foreground line-clamp-2 mb-3">{video.prompt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Badge color="gray">{video.model}</Badge>
                      <span>{video.duration}</span>
                      <span>{video.resolution}</span>
                      <span>{video.aspectRatio}</span>
                    </div>
                    {video.status === 'done' && (
                      <Button variant="ghost" size="sm">⬇️ {t('download')}</Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Main Page ====================

export default function VideoPage() {
  const t = useTranslations('video');

  const tabItems: TabItem[] = [
    {
      key: 'understand',
      label: `🎬 ${t('tabUnderstand')}`,
      content: <UnderstandPanel />,
    },
    {
      key: 'generate',
      label: `🎥 ${t('tabGenerate')}`,
      content: <GeneratePanel />,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <h1 className="text-sm font-semibold">🎬 {t('title')}</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-2">
          <Tabs items={tabItems} defaultKey="understand" />
        </div>
      </div>
    </div>
  );
}
