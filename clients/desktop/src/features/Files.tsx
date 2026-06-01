import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Files({ requireAuth, isAuthed }: FeatureProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (isAuthed) loadFiles(); }, [isAuthed]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/files');
      setFiles(data.files || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (requireAuth && !requireAuth()) return;
    setUploading(true); setError('');
    try {
      const formData = new FormData(); formData.append('file', file);
      const resp = await fetch(`${api.baseUrl}/api/files`, { method: 'POST', body: formData, credentials: 'include' });
      if (resp.ok) loadFiles(); else setError('上传失败');
    } catch (e: any) { setError(e.message); } finally { setUploading(false); }
  };

  const deleteFile = async (id: string) => {
    try { await api.delete(`/api/files/${id}`); setFiles(prev => prev.filter(f => f.id !== id)); } catch {}
  };

  const formatSize = (bytes: number) => bytes < 1024 ? bytes+'B' : bytes < 1048576 ? (bytes/1024).toFixed(1)+'KB' : (bytes/1048576).toFixed(1)+'MB';

  return (
    <div className="feature-container">
      <div className="feature-header">
        <h2>📁 文件管理</h2>
        <label className="btn-small" style={{cursor:'pointer'}}>
          {uploading ? '上传中...' : '+ 上传文件'}
          <input type="file" onChange={handleUpload} style={{display:'none'}} disabled={uploading} />
        </label>
      </div>
      {error && <div className="error-banner"><span>⚠️ {error}</span><button onClick={()=>setError('')}>✕</button></div>}
      {loading ? <div className="loading">加载中...</div> : (
        <div className="file-list">
          {files.length === 0 ? <div className="empty-hint">暂无文件</div> : files.map(f => (
            <div key={f.id} className="file-item">
              <span className="file-icon">📄</span>
              <div className="file-info"><span className="file-name">{f.originalName || f.name}</span><span className="file-meta">{formatSize(f.size)} · {f.mimeType}</span></div>
              <button className="btn-icon" onClick={() => deleteFile(f.id)} title="删除">🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
