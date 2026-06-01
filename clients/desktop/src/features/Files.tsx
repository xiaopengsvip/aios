import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Files({ requireAuth, isAuthed }: FeatureProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isAuthed) loadFiles(); }, [isAuthed]);

  const loadFiles = async () => {
    setLoading(true);
    try { const data = await api.get('/api/files'); setFiles(data.files || []); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const uploadFile = async (file: File) => {
    if (requireAuth && !requireAuth()) return;
    setUploading(true); setError('');
    try {
      const formData = new FormData(); formData.append('file', file);
      const resp = await fetch(`${api.getPublicBaseUrl()}/api/files`, { method: 'POST', body: formData, credentials: 'include' });
      if (resp.ok) loadFiles(); else setError('上传失败');
    } catch (e: any) { setError(e.message); }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(uploadFile);
  };

  const deleteFile = async (id: string) => {
    try { await api.delete(`/api/files/${id}`); setFiles(prev => prev.filter(f => f.id !== id)); if (selectedFile?.id === id) setSelectedFile(null); } catch {}
  };

  const formatSize = (b: number) => b < 1024 ? b+'B' : b < 1048576 ? (b/1024).toFixed(1)+'KB' : (b/1048576).toFixed(1)+'MB';
  const fileIcon = (mime: string) => {
    if (mime?.includes('image')) return '🖼️'; if (mime?.includes('video')) return '🎬';
    if (mime?.includes('audio')) return '🎵'; if (mime?.includes('pdf')) return '📄';
    if (mime?.includes('json') || mime?.includes('javascript') || mime?.includes('typescript')) return '💻';
    return '📁';
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* File list */}
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>📁 文件管理</h2>
          <span style={{ fontSize: 12, color: '#888' }}>{files.length} 个文件</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <label className="btn-small" style={{ cursor: 'pointer' }}>
              {uploading ? '上传中...' : '+ 上传文件'}
              <input ref={fileInputRef} type="file" multiple onChange={e => Array.from(e.target.files || []).forEach(uploadFile)} style={{ display: 'none' }} />
            </label>
            <button className="btn-small" onClick={loadFiles}>刷新</button>
          </div>
        </div>

        {dragOver && <div style={{ padding: 20, textAlign: 'center', background: 'rgba(99,102,241,0.1)', border: '2px dashed #6366f1', margin: 8, borderRadius: 12, fontSize: 14 }}>📥 拖拽文件到此处上传</div>}
        {error && <div className="error-banner" style={{ margin: '8px 16px' }}><span>⚠️ {error}</span><button onClick={() => setError('')}>✕</button></div>}

        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>加载中...</div> : files.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            <span style={{ fontSize: 48 }}>📁</span><h3>暂无文件</h3><p style={{ fontSize: 13 }}>拖拽文件或点击上传</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
            {files.map(f => (
              <div key={f.id} onClick={() => setSelectedFile(f)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selectedFile?.id === f.id ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
                <span style={{ fontSize: 24 }}>{fileIcon(f.mimeType)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.originalName || f.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{formatSize(f.size)} · {f.mimeType} · {new Date(f.createdAt).toLocaleDateString('zh-CN')}</div>
                </div>
                <button className="btn-icon" onClick={e => { e.stopPropagation(); deleteFile(f.id); }} style={{ fontSize: 14, color: '#888' }} title="删除">🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File preview panel */}
      {selectedFile && (
        <div style={{ width: 360, borderLeft: '1px solid var(--border)', padding: 16, overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>文件详情</h3>
            <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 48 }}>{fileIcon(selectedFile.mimeType)}</span>
          </div>
          <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div><span style={{ color: '#888' }}>名称:</span> {selectedFile.originalName || selectedFile.name}</div>
            <div><span style={{ color: '#888' }}>大小:</span> {formatSize(selectedFile.size)}</div>
            <div><span style={{ color: '#888' }}>类型:</span> {selectedFile.mimeType}</div>
            <div><span style={{ color: '#888' }}>上传:</span> {new Date(selectedFile.createdAt).toLocaleString('zh-CN')}</div>
          </div>
          {selectedFile.mimeType?.startsWith('image/') && (
            <img src={`${api.getPublicBaseUrl()}/api/files/${selectedFile.id}`} alt="" style={{ width: '100%', borderRadius: 8, marginTop: 12 }} />
          )}
        </div>
      )}
    </div>
  );
}
