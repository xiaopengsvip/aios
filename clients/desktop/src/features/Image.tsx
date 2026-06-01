import { useState } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Image({ requireAuth, isAuthed }: FeatureProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<{url:string,prompt:string,time:number}[]>([]);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const styles = [
    { key: 'realistic', label: '写实', icon: '📷' },
    { key: 'anime', label: '动漫', icon: '🎌' },
    { key: 'oil', label: '油画', icon: '🖼️' },
    { key: 'watercolor', label: '水彩', icon: '🎨' },
    { key: 'sketch', label: '素描', icon: '✏️' },
    { key: 'pixel', label: '像素', icon: '👾' },
    { key: '3d', label: '3D', icon: '🧊' },
  ];
  const sizes = ['512x512', '1024x1024', '1024x768', '768x1024', '1536x1024'];

  const generate = async () => {
    if (!prompt.trim()) return;
    if (requireAuth && !requireAuth()) return;
    setIsGenerating(true); setError('');
    try {
      const data = await api.post('/api/images/generate', { prompt, style, size });
      const url = data.url || data.urls?.[0] || '';
      if (url) setImages(prev => [{ url, prompt, time: Date.now() }, ...prev]);
      else setError('生成失败：无返回URL');
    } catch (e: any) { setError(e.message); }
    setIsGenerating(false);
  };

  const downloadImage = (url: string) => {
    const a = document.createElement('a'); a.href = url; a.download = `aios-image-${Date.now()}.png`; a.click();
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Control panel */}
      <div style={{ width: 320, borderRight: '1px solid var(--border)', padding: 16, overflowY: 'auto', flexShrink: 0 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🎨 AI 绘图</h2>

        <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>提示词</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="描述你想要的图片..." rows={4} style={{ width: '100%', resize: 'vertical', marginBottom: 12 }} />

        <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>风格</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {styles.map(s => (
            <button key={s.key} className={`chip ${style === s.key ? 'active' : ''}`} onClick={() => setStyle(s.key)} style={{ fontSize: 12 }}>{s.icon} {s.label}</button>
          ))}
        </div>

        <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>尺寸</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {sizes.map(s => (
            <button key={s} className={`chip ${size === s ? 'active' : ''}`} onClick={() => setSize(s)} style={{ fontSize: 11 }}>{s}</button>
          ))}
        </div>

        <button className="btn-send" onClick={generate} disabled={isGenerating || !prompt.trim()} style={{ width: '100%' }}>
          {isGenerating ? '⏳ 生成中...' : '🎨 生成图片'}
        </button>
        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>⚠️ {error}</div>}

        {/* History */}
        {images.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>📋 生成历史 ({images.length})</h3>
            {images.map((img, i) => (
              <div key={i} onClick={() => setSelectedImage(img.url)} style={{ display: 'flex', gap: 8, padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                <img src={img.url} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.prompt}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>{new Date(img.time).toLocaleTimeString('zh-CN')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image gallery */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {selectedImage ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
              <button className="btn-small" onClick={() => downloadImage(selectedImage)}>📥 下载</button>
              <button className="btn-small" onClick={() => setSelectedImage(null)}>✕ 关闭</button>
            </div>
            <img src={selectedImage} alt="" style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', borderRadius: 12, objectFit: 'contain' }} />
          </div>
        ) : images.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
            <span style={{ fontSize: 64, marginBottom: 12 }}>🎨</span>
            <h3>输入提示词开始创作</h3>
            <p style={{ fontSize: 13 }}>支持多种风格和尺寸</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {images.map((img, i) => (
              <div key={i} onClick={() => setSelectedImage(img.url)} style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={img.url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '6px 8px', fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.prompt}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
