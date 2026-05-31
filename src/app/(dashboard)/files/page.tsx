'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';


interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
  uploadedAt: Date;
  usedInConversations: number;
}

const fileTypeIcons: Record<string, string> = {
  image: '🖼️',
  video: '🎬',
  audio: '🎵',
  pdf: '📕',
  doc: '📄',
  code: '💻',
  archive: '📦',
  other: '📁',
};

const getFileType = (mimeType: string, name: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar') || mimeType.includes('gzip')) return 'archive';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) return 'doc';
  if (['js', 'ts', 'py', 'java', 'cpp', 'html', 'css', 'json', 'yaml', 'sh'].includes(ext)) return 'code';
  return 'other';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export default function FilesPage() {
  const t = useTranslations('files');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载文件列表
  const fetchFiles = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/files?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      setFiles(data.files.map((f: any) => ({
        id: f.id,
        name: f.originalName,
        type: getFileType(f.mimeType, f.originalName),
        size: f.size,
        url: f.url,
        thumbnail: f.thumbnailUrl || (f.mimeType.startsWith('image/') ? f.url : undefined),
        uploadedAt: new Date(f.createdAt),
        usedInConversations: 0,
      })));
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType, searchQuery]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const filteredFiles = files;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleUpload(droppedFiles);
  }, []);

  const handleUpload = async (uploadFiles: File[]) => {
    setIsUploading(true);

    for (const file of uploadFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/files', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          console.error('Upload failed:', data.error);
          continue;
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setIsUploading(false);
    fetchFiles();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleUpload(selectedFiles);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const downloadFile = (file: FileItem) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.click();
  };

  return (
    <div className="flex h-full bg-background">
      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="border-b border-border bg-card shrink-0">
          {/* Row 1: title + upload */}
          <div className="h-12 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold">📁 {t('title')}</h1>
              <span className="text-xs text-muted-foreground">{t('fileCount', { count: files.length })}</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-sm text-white hover:bg-indigo-500 transition-all">+ {t('upload')}</button>
          </div>
          {/* Row 2: search + filter + view toggle */}
          <div className="flex items-center gap-2 px-4 pb-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-muted border border-border text-sm text-muted-foreground focus:outline-none focus:border-indigo-500"
            >
              <option value="all">{t('allTypes')}</option>
              <option value="image">{t('typeImage')}</option>
              <option value="video">{t('typeVideo')}</option>
              <option value="audio">{t('typeAudio')}</option>
              <option value="pdf">{t('typePdf')}</option>
              <option value="doc">{t('typeDoc')}</option>
              <option value="code">{t('typeCode')}</option>
              <option value="archive">{t('typeArchive')}</option>
            </select>
            <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-1.5 text-sm ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'
                } transition-all`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1.5 text-sm ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'
                } transition-all`}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-8 mb-6 text-center transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-600/10'
                : 'border-border bg-card/30'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-border border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">{t('uploading')}</p>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-3">📤</div>
                <p className="text-sm text-muted-foreground mb-2">{t('dragDrop')}</p>
                <p className="text-xs text-muted-foreground">{t('dragDropHint')}</p>
              </>
            )}
          </div>

          {/* File list */}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-border border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📁</div>
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery || filterType !== 'all' ? t('noMatchTitle') : t('noFilesTitle')}
              </h2>
              <p className="text-muted-foreground text-sm">
                {searchQuery || filterType !== 'all'
                  ? t('noMatchDesc')
                  : t('noFilesDesc')}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSelectedFile(file)}
                  className={`rounded-xl border cursor-pointer transition-all group ${
                    selectedFile?.id === file.id
                      ? 'border-indigo-500 bg-indigo-600/10'
                      : 'border-border bg-card/50 hover:border-foreground/30'
                  }`}
                >
                  <div className="aspect-square rounded-t-xl overflow-hidden bg-muted/50 flex items-center justify-center">
                    {file.thumbnail ? (
                      <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">{fileTypeIcons[file.type]}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm truncate mb-1 text-foreground">{file.name}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.uploadedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedFile(file)}
                  className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all group ${
                    selectedFile?.id === file.id
                      ? 'border-indigo-500 bg-indigo-600/10'
                      : 'border-border bg-card/50 hover:border-foreground/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                    {file.thumbnail ? (
                      <img src={file.thumbnail} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      fileTypeIcons[file.type]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-foreground">{file.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.uploadedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadFile(file); }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      ⬇️
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-muted transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File details panel — desktop: side panel, mobile: full overlay */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden md:block border-l border-border bg-card overflow-hidden"
          >
            <div className="w-80 h-full flex flex-col">
              <div className="h-14 flex items-center justify-between px-4 border-b border-border">
                <h2 className="text-sm font-semibold">{t('fileDetails')}</h2>
                <button onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="rounded-xl overflow-hidden bg-muted/50 mb-4">
                  {selectedFile.thumbnail ? (
                    <img src={selectedFile.thumbnail} alt={selectedFile.name} className="w-full h-48 object-cover" />
                  ) : selectedFile.type === 'video' ? (
                    <video src={selectedFile.url} controls className="w-full h-48 object-contain bg-black rounded-lg" />
                  ) : selectedFile.type === 'audio' ? (
                    <div className="w-full h-48 flex items-center justify-center bg-muted rounded-lg">
                      <audio src={selectedFile.url} controls className="w-full px-4" />
                    </div>
                  ) : selectedFile.type === 'pdf' ? (
                    <iframe src={selectedFile.url} className="w-full h-48 rounded-lg border border-border" title={selectedFile.name} />
                  ) : (
                    <div className="h-48 flex items-center justify-center">
                      <span className="text-6xl">{fileTypeIcons[selectedFile.type]}</span>
                    </div>
                  )}
                </div>

                <h3 className="font-medium mb-4 break-all text-foreground">{selectedFile.name}</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('fileType')}</span>
                    <span className="capitalize">{selectedFile.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('fileSize')}</span>
                    <span>{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('uploadTime')}</span>
                    <span>{selectedFile.uploadedAt.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => downloadFile(selectedFile)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-sm text-white hover:bg-indigo-500 transition-all"
                  >
                    ⬇️ {t('downloadFile')}
                  </button>
                  <button
                    onClick={() => deleteFile(selectedFile.id)}
                    className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-600/10 transition-all"
                  >
                    🗑️ {t('deleteFile')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile file details overlay */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-background flex flex-col"
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedFile(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <h2 className="text-sm font-semibold">{t('fileDetails')}</h2>
              </div>
              <button onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="rounded-xl overflow-hidden bg-muted/50 mb-4">
                {selectedFile.thumbnail ? (
                  <img src={selectedFile.thumbnail} alt={selectedFile.name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="h-48 flex items-center justify-center">
                    <span className="text-6xl">{fileTypeIcons[selectedFile.type]}</span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium mb-2">{selectedFile.name}</h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>{t('type')}: {selectedFile.type}</p>
                <p>{t('size')}: {formatFileSize(selectedFile.size)}</p>
                <p>{t('uploadTime')}: {selectedFile.uploadedAt.toLocaleString()}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <a href={selectedFile.url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 text-center rounded-xl bg-indigo-600 text-white text-sm">查看</a>
                <button onClick={() => deleteFile(selectedFile.id)} className="flex-1 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm">🗑️ 删除</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
