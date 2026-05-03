// EvidenceLockerPage — secure file upload + management for a case.
// Route: /safe-space/evidence/:caseId  (also embedded in CaseDetailPage)
// Both survivors and staff can view; upload rights depend on role.

import { useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────

interface EvidenceFile {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  uploaded_by: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string): string {
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('video/')) return '🎥';
  if (mime.startsWith('audio/')) return '🎵';
  if (mime === 'application/pdf') return '📄';
  return '📁';
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,audio/wav,application/pdf';

// ─── Component ────────────────────────────────────────────────

export default function EvidenceLockerPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewingUrl, setViewingUrl] = useState<{ url: string; name: string; mime: string } | null>(null);

  // ─── Fetch evidence list ───────────────────────────────────

  const { data: files = [], isLoading } = useQuery<EvidenceFile[]>({
    queryKey: ['evidence', caseId],
    queryFn: async () => {
      const res = await api.get(`/cases/${caseId}/evidence`);
      return res.data.data;
    },
    enabled: !!caseId,
  });

  // ─── Upload mutation ───────────────────────────────────────

  const uploadMutation = useMutation({
    mutationFn: async (filesToUpload: File[]) => {
      const formData = new FormData();
      filesToUpload.forEach((f) => formData.append('files', f));
      const res = await api.post(`/cases/${caseId}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
    onSuccess: () => {
      setUploadQueue([]);
      queryClient.invalidateQueries({ queryKey: ['evidence', caseId] });
    },
  });

  // ─── Delete mutation ───────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await api.delete(`/cases/${caseId}/evidence/${fileId}`);
    },
    onSuccess: () => {
      setDeleteTargetId(null);
      queryClient.invalidateQueries({ queryKey: ['evidence', caseId] });
    },
  });

  // ─── Signed URL fetch ──────────────────────────────────────

  const openFile = async (fileId: string, fileName: string, mime: string) => {
    try {
      const res = await api.get(`/cases/${caseId}/evidence/${fileId}/url`);
      const url = res.data.data.url;
      if (mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('video/') || mime.startsWith('audio/')) {
        setViewingUrl({ url, name: fileName, mime });
      } else {
        window.open(url, '_blank');
      }
    } catch {
      alert('Could not retrieve the file. Please try again.');
    }
  };

  // ─── Drag & drop handlers ──────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setUploadQueue((prev) => [...prev, ...dropped]);
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setUploadQueue((prev) => [...prev, ...picked]);
    e.target.value = '';
  };

  const removeFromQueue = (index: number) => {
    setUploadQueue((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-teal-900 mb-1">Evidence Locker</h1>
          <p className="text-sm text-gray-500">
            All files are encrypted and stored securely. Only you and your assigned case manager can access them.
          </p>
        </div>
        <Link
          to={`/safe-space/cases/${caseId}`}
          className="text-sm text-teal-600 hover:text-teal-800 transition-colors"
        >
          ← Back to case
        </Link>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-6 cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-8 text-center ${
          isDragOver
            ? 'border-teal-500 bg-teal-50 scale-[1.01]'
            : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={onFileInput}
        />
        <div className="mb-3 text-4xl">{isDragOver ? '📂' : '📎'}</div>
        <p className="text-sm font-medium text-dark mb-1">
          {isDragOver ? 'Drop files here' : 'Drag files here, or click to browse'}
        </p>
        <p className="text-xs text-gray-500">
          Photos, videos, audio recordings, PDFs · Max 50 MB each
        </p>
      </div>

      {/* Upload queue */}
      {uploadQueue.length > 0 && (
        <div className="mb-6 rounded-xl border border-teal-100 bg-teal-50 p-4">
          <p className="text-sm font-medium text-teal-800 mb-3">
            {uploadQueue.length} file{uploadQueue.length !== 1 ? 's' : ''} ready to upload
          </p>
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {uploadQueue.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{getFileIcon(f.type)}</span>
                  <span className="text-xs text-dark truncate">{f.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatBytes(f.size)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromQueue(i); }}
                  className="ml-2 shrink-0 text-gray-400 hover:text-red-500 transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => uploadMutation.mutate(uploadQueue)}
            disabled={uploadMutation.isPending}
            className="w-full rounded-xl bg-teal-500 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? 'Uploading...' : `Upload ${uploadQueue.length} file${uploadQueue.length !== 1 ? 's' : ''}`}
          </button>
          {uploadMutation.isError && (
            <p className="mt-2 text-xs text-red-500 text-center">Upload failed. Please try again.</p>
          )}
        </div>
      )}

      {/* File grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">🔒</p>
          <p className="font-medium text-dark mb-1">No evidence uploaded yet</p>
          <p className="text-sm text-gray-500">
            Add photos, videos, audio recordings, or documents to support your case.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-teal-200 hover:shadow-md transition-all duration-150"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0">{getFileIcon(file.mime_type)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-dark truncate" title={file.file_name}>
                    {file.file_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatBytes(file.size_bytes)} · {relativeTime(file.created_at)}
                  </p>
                </div>
              </div>

              {/* Action buttons — appear on hover */}
              <div className="absolute inset-x-0 bottom-0 flex gap-2 rounded-b-xl bg-white/95 px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 border-t border-gray-100">
                <button
                  onClick={() => openFile(file.id, file.file_name, file.mime_type)}
                  className="flex-1 rounded-lg bg-teal-500 py-1.5 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => setDeleteTargetId(file.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-lg text-dark mb-2">Delete this file?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. The file will be permanently removed from your case.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTargetId)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app file viewer modal */}
      {viewingUrl && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-4xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-white truncate">{viewingUrl.name}</p>
              <div className="flex gap-3">
                <a
                  href={viewingUrl.url}
                  download={viewingUrl.name}
                  className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={() => setViewingUrl(null)}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors"
                >
                  Close ✕
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl bg-black max-h-[80vh] flex items-center justify-center">
              {viewingUrl.mime.startsWith('image/') && (
                <img src={viewingUrl.url} alt={viewingUrl.name} className="max-h-[80vh] max-w-full object-contain" />
              )}
              {viewingUrl.mime.startsWith('video/') && (
                <video src={viewingUrl.url} controls className="max-h-[80vh] max-w-full" />
              )}
              {viewingUrl.mime.startsWith('audio/') && (
                <div className="p-8 text-center">
                  <p className="text-6xl mb-4">🎵</p>
                  <p className="text-white text-sm mb-4">{viewingUrl.name}</p>
                  <audio src={viewingUrl.url} controls className="w-full" />
                </div>
              )}
              {viewingUrl.mime === 'application/pdf' && (
                <iframe src={viewingUrl.url} title={viewingUrl.name} className="w-full h-[80vh]" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
