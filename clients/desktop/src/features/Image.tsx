import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ImageProps {
  requireAuth?: (callback?: () => void) => boolean;
  isAuthed?: boolean;
}

export function Image({ requireAuth, isAuthed }: ImageProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');

  const styles = [
    { key: 'realistic', label: '写实' },
    { key: 'anime', label: '动漫' },
    { key: 'oil', label: '油画' },
    { key: 'watercolor', label: '水彩' },
    { key: 'sketch', label: '素描' },
  ];

  const generate = async () => {
    if (!prompt.trim()) return;
    if (requireAuth && !requireAuth()) return;
    setIsGenerating(true);
    setError('');
    try {
      const data = await api.post('/api/images/generate', { prompt, style, size: '1024x1024' });
      const url = data.url || data.urls?.[0] || '';
      if (url) setImages(prev => [url, ...prev]);
      else setError('生成失败：无返回URL');
    } catch (e: any) {
      setError(e.message || '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="feature-container">
      <div className="feature-header"><h2>🎨 AI 绘图</h2></div>
      <div className="feature-body">
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="描述你想要的图片..." rows={3} />
        <div className="style-selector">
          {styles.map(s => (
            <button key={s.key} className={`chip ${style === s.key ? 'active' : ''}`} onClick={() => setStyle(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
        <button className="btn-send" onClick={generate} disabled={isGenerating || !prompt.trim()}>
          {isGenerating ? '⏳ 生成中...' : '🎨 生成图片'}
        </button>
        {error && <div className="error-banner"><span>⚠️ {error}</span><button onClick={() => setError('')}>✕</button></div>}
        <div className="image-grid">
          {images.map((url, i) => (
            <div key={i} className="image-card"><img src={url} alt={`Generated ${i}`} /></div>
          ))}
        </div>
      </div>
    </div>
  );
}
