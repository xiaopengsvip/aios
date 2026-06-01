import { useState } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Video({ requireAuth, _isAuthed }: FeatureProps) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('5s');
  const [resolution, setResolution] = useState('720p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videos, setVideos] = useState<{url:string,prompt:string,time:number}[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!prompt.trim()) return;
    if (requireAuth && !requireAuth()) return;
    setIsGenerating(true); setError('');
    try {
      const data = await api.post('/api/video/generate', { prompt, duration, resolution, aspectRatio });
      const url = data.video?.url || data.url || '';
      if (url) setVideos(prev => [{ url, prompt, time: Date.now() }, ...prev]); else setError('生成失败');
    } catch (e: any) { setError(e.message); }
    setIsGenerating(false);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 300, borderRight: '1px solid var(--border)', padding: 16, overflowY: 'auto', flexShrink: 0 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🎬 视频生成</h2>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="描述你想要的视频..." rows={4} style={{ width: '100%', marginBottom: 12, resize: 'vertical' }} />

        <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>时长</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {['3s','5s','10s'].map(d => <button key={d} className={`chip ${duration===d?'active':''}`} onClick={()=>setDuration(d)}>{d}</button>)}
        </div>

        <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>分辨率</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {['480p','720p','1080p'].map(r => <button key={r} className={`chip ${resolution===r?'active':''}`} onClick={()=>setResolution(r)}>{r}</button>)}
        </div>

        <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>比例</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[['16:9','横屏'],['9:16','竖屏'],['1:1','方形']].map(([k,l]) => <button key={k} className={`chip ${aspectRatio===k?'active':''}`} onClick={()=>setAspectRatio(k)}>{l}</button>)}
        </div>

        <button className="btn-send" onClick={generate} disabled={isGenerating||!prompt.trim()} style={{ width: '100%' }}>
          {isGenerating ? '⏳ 生成中... (1-3分钟)' : '🎬 生成视频'}
        </button>
        {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>⚠️ {error}</div>}

        {videos.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>📋 历史 ({videos.length})</h3>
            {videos.map((v, i) => (
              <div key={i} onClick={() => setSelectedVideo(v.url)} style={{ padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.prompt}</div>
                <div style={{ fontSize: 10, color: '#666' }}>{new Date(v.time).toLocaleTimeString('zh-CN')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {selectedVideo ? (
          <div style={{ maxWidth: 800, width: '100%' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, justifyContent: 'flex-end' }}>
              <button className="btn-small" onClick={() => { const a = document.createElement('a'); a.href = selectedVideo; a.download = `aios-video-${Date.now()}.mp4`; a.click(); }}>📥 下载</button>
              <button className="btn-small" onClick={() => setSelectedVideo(null)}>✕</button>
            </div>
            <video src={selectedVideo} controls style={{ width: '100%', borderRadius: 12 }} />
          </div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888' }}>
            <span style={{ fontSize: 64 }}>🎬</span>
            <h3>输入描述开始生成视频</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, width: '100%' }}>
            {videos.map((v, i) => (
              <div key={i} onClick={() => setSelectedVideo(v.url)} style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <video src={v.url} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '6px 8px', fontSize: 11, color: '#888' }}>{v.prompt.slice(0, 60)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
