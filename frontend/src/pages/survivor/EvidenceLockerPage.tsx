// EvidenceLockerPage — secure file upload + management for a case.
// Route: /safe-space/evidence/:caseId — Fully localized via evidenceLocker namespace.
// Uses semantic tokens + Lucide icons.

import { useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, Image, Video, Music, FileText, File, X, Eye, Trash2, Download, Lock } from 'lucide-react';
import api from '../../lib/api';

interface EvidenceFile {
  id: string; file_name: string; mime_type: string;
  size_bytes: number; created_at: string; uploaded_by: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return Image;
  if (mime.startsWith('video/')) return Video;
  if (mime.startsWith('audio/')) return Music;
  if (mime === 'application/pdf') return FileText;
  return File;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,audio/wav,application/pdf';

export default function EvidenceLockerPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { t } = useTranslation('evidenceLocker');
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewingUrl, setViewingUrl] = useState<{ url: string; name: string; mime: string } | null>(null);

  const { data: files = [], isLoading } = useQuery<EvidenceFile[]>({
    queryKey: ['evidence', caseId],
    queryFn: async () => { const r = await api.get(`/cases/${caseId}/evidence`); return r.data.data; },
    enabled: !!caseId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (filesToUpload: File[]) => {
      const fd = new FormData();
      filesToUpload.forEach((f) => fd.append('files', f));
      const r = await api.post(`/cases/${caseId}/evidence`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return r.data.data;
    },
    onSuccess: () => { setUploadQueue([]); queryClient.invalidateQueries({ queryKey: ['evidence', caseId] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => api.delete(`/cases/${caseId}/evidence/${fileId}`),
    onSuccess: () => { setDeleteTargetId(null); queryClient.invalidateQueries({ queryKey: ['evidence', caseId] }); },
  });

  const openFile = async (fileId: string, fileName: string, mime: string) => {
    try {
      const r = await api.get(`/cases/${caseId}/evidence/${fileId}/url`);
      const url = r.data.data.url;
      if (mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('video/') || mime.startsWith('audio/')) {
        setViewingUrl({ url, name: fileName, mime });
      } else { window.open(url, '_blank'); }
    } catch { alert(t('retrieveError')); }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    setUploadQueue((p) => [...p, ...Array.from(e.dataTransfer.files)]);
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadQueue((p) => [...p, ...Array.from(e.target.files ?? [])]);
    e.target.value = '';
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to={`/safe-space/cases/${caseId}`} className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors mb-1">
            <ArrowLeft className="h-3 w-3" /> {t('backLink')}
          </Link>
          <h1 className="font-heading text-2xl text-heading mb-1">{t('heading')}</h1>
          <p className="text-sm text-muted">{t('subtitle')}</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-6 cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-8 text-center ${isDragOver ? 'border-primary bg-primary-soft scale-[1.01]' : 'border-border bg-surface hover:border-primary/50 hover:bg-primary-soft/30'}`}
      >
        <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_TYPES} className="hidden" onChange={onFileInput} />
        <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${isDragOver ? 'bg-primary text-primary-fg' : 'bg-primary-soft text-primary'} transition-colors`}>
          <Upload className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-heading mb-1">{isDragOver ? t('dropzone.over') : t('dropzone.idle')}</p>
        <p className="text-xs text-muted">{t('dropzone.hint')}</p>
      </div>

      {/* Upload queue */}
      {uploadQueue.length > 0 && (
        <div className="mb-6 rounded-2xl border border-primary-muted bg-primary-soft p-4">
          <p className="text-sm font-medium text-primary mb-3">
            {t('queue.ready', { count: uploadQueue.length })}
          </p>
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {uploadQueue.map((f, i) => {
              const FileIcon = getFileIcon(f.type);
              return (
                <div key={i} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileIcon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-heading truncate">{f.name}</span>
                    <span className="text-xs text-muted shrink-0">{formatBytes(f.size)}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setUploadQueue((p) => p.filter((_, j) => j !== i)); }}
                    className="ml-2 shrink-0 text-muted hover:text-danger transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={() => uploadMutation.mutate(uploadQueue)} disabled={uploadMutation.isPending}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-fg hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {uploadMutation.isPending ? t('queue.uploading') : t('queue.uploadBtn', { count: uploadQueue.length })}
          </button>
          {uploadMutation.isError && <p className="mt-2 text-xs text-danger text-center">{t('queue.error')}</p>}
        </div>
      )}

      {/* File grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <p className="font-medium text-heading mb-1">{t('empty.title')}</p>
          <p className="text-sm text-muted">{t('empty.body')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.mime_type);
            return (
              <div key={file.id} className="group relative rounded-2xl border border-border bg-surface p-4 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <FileIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-heading truncate" title={file.file_name}>{file.file_name}</p>
                    <p className="text-xs text-muted mt-0.5">{formatBytes(file.size_bytes)} · {relativeTime(file.created_at)}</p>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex gap-2 rounded-b-2xl bg-surface/95 px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 border-t border-border-muted">
                  <button onClick={() => openFile(file.id, file.file_name, file.mime_type)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-primary py-1.5 text-xs font-medium text-primary-fg hover:bg-primary-hover transition-colors">
                    <Eye className="h-3 w-3" /> {t('files.view')}
                  </button>
                  <button onClick={() => setDeleteTargetId(file.id)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft transition-colors">
                    <Trash2 className="h-3 w-3" /> {t('files.delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-heading/40 backdrop-blur-sm px-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-surface border border-border p-6 shadow-2xl animate-scale-in">
            <h3 className="font-heading text-lg text-heading mb-2">{t('deleteModal.title')}</h3>
            <p className="text-sm text-muted mb-6">{t('deleteModal.body')}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTargetId(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-body hover:bg-inset transition-colors">
                {t('deleteModal.cancel')}
              </button>
              <button onClick={() => deleteMutation.mutate(deleteTargetId)} disabled={deleteMutation.isPending}
                className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-medium text-danger-fg hover:brightness-110 transition-all disabled:opacity-60">
                {deleteMutation.isPending ? t('deleteModal.deleting') : t('deleteModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File viewer modal */}
      {viewingUrl && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-heading/80 p-4 animate-fade-in">
          <div className="w-full max-w-4xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-white truncate">{viewingUrl.name}</p>
              <div className="flex gap-3">
                <a href={viewingUrl.url} download={viewingUrl.name}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-fg hover:bg-primary-hover transition-colors">
                  <Download className="h-3 w-3" /> {t('viewer.download')}
                </a>
                <button onClick={() => setViewingUrl(null)}
                  className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors">
                  {t('viewer.close')}
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl bg-black max-h-[80vh] flex items-center justify-center">
              {viewingUrl.mime.startsWith('image/') && <img src={viewingUrl.url} alt={viewingUrl.name} className="max-h-[80vh] max-w-full object-contain" />}
              {viewingUrl.mime.startsWith('video/') && <video src={viewingUrl.url} controls className="max-h-[80vh] max-w-full" />}
              {viewingUrl.mime.startsWith('audio/') && (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Music className="h-8 w-8" />
                  </div>
                  <p className="text-white text-sm mb-4">{viewingUrl.name}</p>
                  <audio src={viewingUrl.url} controls className="w-full" />
                </div>
              )}
              {viewingUrl.mime === 'application/pdf' && <iframe src={viewingUrl.url} title={viewingUrl.name} className="w-full h-[80vh]" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
