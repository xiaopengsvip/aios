import { useState } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Audio({ requireAuth, isAuthed }: FeatureProps) {
  const [prompt, setPrompt] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audios, setAudios] = useState<{url:string,prompt:string}[]>([]);
  const [error, setError] = useState('');

  const voices = [['alloy','中性'],['echo','男性'],['fable','叙事'],['onyx','深沉'],['nova','女性'],['shimmer','温柔']];

  const generate = async () => {
    if (!prompt.trim()) return;
    if (requireAuth && !requireAuth()) return;
    setIsGenerating(true); setError('');
    try {
      const data = await api.post('/api/audio/generate', { prompt, voice, format: 'mp3' });
      const url = data.url || '';
      if (url) setAudios(prev => [{url,prompt},...prev]); else setError('生成失败');
    } catch (e: any) { setError(e.message); } finally { setIsGenerating(false); }
  };

  return (
    <div className="feature-container">
      <div className="feature-header"><h2>🎵 音频生成</h2></div>
      <div className="feature-body">
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="输入文本或描述音频..." rows={3} />
        <div className="style-selector">
          <label>语音:</label>
          {voices.map(([k,l]) => <button key={k} className={`chip ${voice===k?'active':''}`} onClick={()=>setVoice(k)}>{l}</button>)}
        </div>
        <button className="btn-send" onClick={generate} disabled={isGenerating||!prompt.trim()}>
          {isGenerating ? '⏳ 生成中...' : '🎵 生成音频'}
        </button>
        {error && <div className="error-banner"><span>⚠️ {error}</span><button onClick={()=>setError('')}>✕</button></div>}
        {audios.map((a, i) => (
          <div key={i} className="audio-card">
            <p style={{fontSize:13,color:'#888',marginBottom:4}}>{a.prompt.slice(0,60)}</p>
            <audio src={a.url} controls style={{width:'100%'}} />
          </div>
        ))}
      </div>
    </div>
  );
}
