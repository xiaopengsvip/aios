'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button, Empty, Badge, Tabs } from '@/components/ui';
import type { TabItem } from '@/components/ui';


interface GeneratedAudio {
  id: string;
  url: string;
  text: string;
  voice: string;
  provider: string;
  speed: number;
  pitch: number;
  format: string;
  duration?: string;
  createdAt: Date;
}

interface UnderstandResult {
  id: string;
  fileName: string;
  prompt: string;
  result: string;
  model: string;
  createdAt: Date;
}

const providers = [
  {
    id: 'openai',
    name: 'OpenAI TTS',
    icon: '🟢',
    voices: [
      { id: 'alloy', name: 'Alloy' },
      { id: 'echo', name: 'Echo' },
      { id: 'fable', name: 'Fable' },
      { id: 'onyx', name: 'Onyx' },
      { id: 'nova', name: 'Nova' },
      { id: 'shimmer', name: 'Shimmer' },
    ],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    icon: '🔵',
    voices: [
      { id: 'rachel', name: 'Rachel' },
      { id: 'domi', name: 'Domi' },
      { id: 'bella', name: 'Bella' },
      { id: 'elli', name: 'Elli' },
      { id: 'josh', name: 'Josh' },
      { id: 'arnold', name: 'Arnold' },
    ],
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    icon: '🟡',
    voices: [
      { id: 'male-1', name: 'Male 1' },
      { id: 'male-2', name: 'Male 2' },
      { id: 'female-1', name: 'Female 1' },
      { id: 'female-2', name: 'Female 2' },
    ],
  },
];

const formats = ['mp3', 'wav', 'opus', 'flac'];

// ==================== Understand Mode ====================

function UnderstandPanel() {
  const t = useTranslations('audio');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<UnderstandResult[]>([]);
  const [currentResult, setCurrentResult] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('audio/')) return;
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

  const analyzeAudio = async () => {
    if (!uploadedFile || !prompt.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setCurrentResult('');

    try {
      const response = await fetch('/api/multimodal/understand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'audio',
          audioUrl: `data:audio/mp3;base64,${uploadedFile}`,
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
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('uploadAudio')}</label>
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
              <span className="text-3xl mb-2">🎵</span>
              <p className="text-xs text-muted-foreground">{t('uploadHint')}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{t('uploadFormats')}</p>
              <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileInput} className="hidden" />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎵</span>
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
          onClick={analyzeAudio}
          disabled={!uploadedFile || !prompt.trim() || isAnalyzing}
          loading={isAnalyzing}
          className="w-full"
          size="lg"
        >
          {!isAnalyzing && `🎵 ${t('understandButton')}`}
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
            icon={<span className="text-5xl">🎵</span>}
            title={t('understandEmpty')}
            message=""
          />
        ) : results.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{t('history')}</h2>
            {results.map((r) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card/80 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🎵</span>
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
  const t = useTranslations('audio');
  const [text, setText] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(providers[0]);
  const [selectedVoice, setSelectedVoice] = useState(providers[0].voices[0]);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [format, setFormat] = useState(formats[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const generateAudio = async () => {
    if (!text.trim() || isGenerating) return;
    setIsGenerating(true);

    setTimeout(() => {
      const newAudio: GeneratedAudio = {
        id: Date.now().toString(),
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        text: text.trim(),
        voice: selectedVoice.name,
        provider: selectedProvider.name,
        speed,
        pitch,
        format,
        duration: '0:15',
        createdAt: new Date(),
      };
      setGeneratedAudios((prev) => [newAudio, ...prev]);
      setIsGenerating(false);
    }, 2000);
  };

  const togglePlay = (audio: GeneratedAudio) => {
    if (playingAudio === audio.id) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audio.url;
        audioRef.current.play();
        setPlayingAudio(audio.id);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
      <div className="max-w-4xl mx-auto p-6">
        <div className="rounded-xl border border-border bg-card/80 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('textInput')}</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('textPlaceholder')} rows={4} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none" />
              <div className="text-xs text-muted-foreground mt-1">{t('charCount', { count: text.length })}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('voice')}</label>
              <div className="flex flex-wrap gap-2">
                {selectedProvider.voices.map((voice) => (
                  <button key={voice.id} onClick={() => setSelectedVoice(voice)} className={`px-4 py-2 rounded-lg text-xs transition-all ${selectedVoice.id === voice.id ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border text-muted-foreground hover:text-foreground'}`}>{voice.name}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('speedLabel')}: {speed.toFixed(1)}x</label>
                <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                <div className="flex justify-between text-xs text-muted-foreground/60"><span>0.5x</span><span>2.0x</span></div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('pitch')}: {pitch.toFixed(1)}</label>
                <input type="range" min="0.5" max="2.0" step="0.1" value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                <div className="flex justify-between text-xs text-muted-foreground/60"><span>{t('low')}</span><span>{t('high')}</span></div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('format')}</label>
                <div className="flex flex-wrap gap-2">
                  {formats.map((f) => (
                    <button key={f} onClick={() => setFormat(f)} className={`px-3 py-2 rounded-lg text-xs uppercase transition-all ${format === f ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border text-muted-foreground hover:text-foreground'}`}>{f}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Button variant="secondary" size="sm" onClick={() => setShowProviderSelector(!showProviderSelector)}>
                  <span>{selectedProvider.icon}</span>
                  <span>{selectedProvider.name}</span>
                  <span className="text-xs">▾</span>
                </Button>
                <AnimatePresence>
                  {showProviderSelector && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProviderSelector(false)} />
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
                        {providers.map((provider) => (
                          <button key={provider.id} onClick={() => { setSelectedProvider(provider); setSelectedVoice(provider.voices[0]); setShowProviderSelector(false); }} className={`flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-muted transition-all ${selectedProvider.id === provider.id ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}>
                            <span>{provider.icon}</span>
                            <span className="font-medium">{provider.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <Button onClick={generateAudio} disabled={!text.trim() || isGenerating} loading={isGenerating} className="flex-1" size="lg">
                {!isGenerating && `🎤 ${t('generate')}`}
                {isGenerating && t('generating')}
              </Button>
            </div>
          </div>
        </div>
        {generatedAudios.length === 0 ? (
          <Empty
            icon={<span className="text-5xl">🎤</span>}
            title={t('emptyTitle')}
            message={t('emptyDesc')}
          />
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{t('history')}</h2>
            {generatedAudios.map((audio) => (
              <motion.div key={audio.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card/80 p-4">
                <div className="flex items-start gap-4">
                  <Button onClick={() => togglePlay(audio)} variant="ghost" className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 shrink-0">{playingAudio === audio.id ? '⏸' : '▶️'}</Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2 mb-2">{audio.text}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge color="gray">{audio.provider}</Badge>
                      <span>{t('voiceLabel')}: {audio.voice}</span>
                      <span>{t('speedLabel')}: {audio.speed}x</span>
                      <span>{t('formatLabel')}: {audio.format.toUpperCase()}</span>
                      {audio.duration && <span>{t('durationLabel')}: {audio.duration}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm">⬇️</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setText(audio.text); const provider = providers.find((p) => p.name === audio.provider); if (provider) { setSelectedProvider(provider); const voice = provider.voices.find((v) => v.name === audio.voice); if (voice) setSelectedVoice(voice); } setSpeed(audio.speed); setPitch(audio.pitch); setFormat(audio.format); }}>🔄</Button>
                  </div>
                </div>
                {playingAudio === audio.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 flex items-center gap-0.5 h-8">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div key={i} className="w-1 bg-indigo-500 rounded-full" animate={{ height: [4, Math.random() * 28 + 4, 4] }} transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.05 }} />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Main Page ====================

export default function AudioPage() {
  const t = useTranslations('audio');

  const tabItems: TabItem[] = [
    {
      key: 'understand',
      label: `🎵 ${t('tabUnderstand')}`,
      content: <UnderstandPanel />,
    },
    {
      key: 'generate',
      label: `🎤 ${t('tabGenerate')}`,
      content: <GeneratePanel />,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
        <h1 className="text-sm font-semibold">🎤 {t('title')}</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-2">
          <Tabs items={tabItems} defaultKey="understand" />
        </div>
      </div>
    </div>
  );
}
