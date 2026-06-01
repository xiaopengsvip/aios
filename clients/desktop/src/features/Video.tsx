import { useState } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Video({ requireAuth, isAuthed }: FeatureProps) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('5s');
  const [resolution, setResolution] = useState('720p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videos, setVideos] = useState<string[]>([]);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!prompt.trim()) return;
    if (requireAuth && !requireAuth()) return;
    setIsGenerating(true); setError('');
    try {
      const data = await api.post('/api/video/generate', { prompt, duration, resolution, aspectRatio });
      const url = data.video?.url || data.url || '';
      if (url) setVideos(prev => [url, ...prev]); else setError('生成失败');
    } catch (e: any) { setError(e.message); } finally { setIsGenerating(false); }
  };

  return (
    <div className="feature-container">
      <div className="feature-header"><h2>🎬 视频生成</h2></div>
      <div className="feature-body">
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="描述你想要的视频..." rows={3} />
        <div className="style-selector">
          <label>时长:</label>
          {['3s','5s','10s'].map(d => <button key={d} className={`chip ${duration===d?'active':''}`} onClick={()=>setDuration(d)}>{d}</button>)}
          <label>分辨率:</label>
          {['480p','720p','1080p'].map(r => <button key={r} className={`chip ${resolution===r?'active':''}`} onClick={()=>setResolution(r)}>{r}</button>)}
          <label>比例:</label>
          {[['16:9','横屏'],['9:16','竖屏'],['1:1','方形']].map(([k,l]) => <button key={k} className={`chip ${aspectRatio===k?'active':''}`} onClick={()=>setAspectRatio(k)}>{l}</button>)}
        </div>
        <button className="btn-send" onClick={generate} disabled={isGenerating||!prompt.trim()}>
          {isGenerating ? '⏳ 生成中... (可能需要1-3分钟)' : '🎬 生成视频'}
        </button>
        {error && <div className="error-banner"><span>⚠️ {error}</span><button onClick={()=>setError('')}>✕</button></div>}
        {videos.map((url, i) => (
          <div key={i} className="video-card"><video src={url} controls style={{width:'100%',borderRadius:8}} /></div>
        ))}
      </div>
    </div>
  );
}
