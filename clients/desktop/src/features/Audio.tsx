import { useState } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Audio({ requireAuth }: FeatureProps) {
  const [prompt, setPrompt] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audios, setAudios] = useState<{url:string,prompt:string,voice:string,time:number}[]>([]);
  const [error, setError] = useState('');
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  const voices = [
    { key: 'alloy', label: '中性', icon: '🎭' },
    { key: 'echo', label: '男性', icon: '👨' },
    { key: 'fable', label: '叙事', icon: '📖' },
    { key: 'onyx', label: '深沉', icon: '🎸' },
    { key: 'nova', label: '女性', icon: '👩' },
    { key: 'shimmer', label: '温柔', icon: '🌸' },
  ];

  const generate = async () => {
    if (!prompt.trim()) return;
    if (requireAuth && !requireAuth()) return;
    setIsGenerating(true); setError('');
    try {
      const data = await api.post('/api/audio/generate', { prompt, voice, format: 'mp3' });
      const url = data.url || '';
      if (url) setAudios(prev => [{ url, prompt, voice, time: Date.now() }, ...prev]); else setError('生成失败');
    } catch (e: any) { setError(e.message); }
    setIsGenerating(false);
  };

  const voiceName = (v: string) => voices.find(x => x.key === v)?.label || v;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 300, borderRight: '1px solid var(--border)', padding: 16, overflowY: 'auto', flexShrink: 0 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🎵 音频生成</h2>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="输入文本或描述音频..." rows={4} style={{ width: '100%', marginBottom: 12, resize: 'vertical' }} />

        <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>语音</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
          {voices.map(v => (
            <button key={v.key} className={`chip ${voice === v.key ? 'active' : ''}`} onClick={() => setVoice(v.key)} style={{ fontSize: 12 }}>{v.icon} {v.label}</button>
          ))}
        </div>

        <button className="btn-send" onClick={generate} disabled={isGenerating||!prompt.trim()} style={{ width: '100%' }}>
          {isGenerating ? '⏳ 生成中...' : '🎵 生成音频'}
        </button>
        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>⚠️ {error}</div>}
      </div>

      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {audios.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
            <span style={{ fontSize: 64 }}>🎵</span>
            <h3>输入文本开始生成音频</h3>
            <p style={{ fontSize: 13 }}>支持多种语音风格</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {audios.map((a, i) => (
              <div key={i} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 12, background: playingUrl === a.url ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{voices.find(v => v.key === a.voice)?.icon || '🎵'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{a.prompt.slice(0, 80)}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>{voiceName(a.voice)} · {new Date(a.time).toLocaleTimeString('zh-CN')}</div>
                  </div>
                </div>
                <audio src={a.url} controls style={{ width: '100%', height: 36 }} onPlay={() => setPlayingUrl(a.url)} onPause={() => setPlayingUrl(null)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
