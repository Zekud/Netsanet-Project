// FileUploadZone — drag-and-drop file upload area with preview support.
// Uses semantic tokens + Lucide icons for dark/light mode support.

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSizeMb?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function FileUploadZone({
  onFilesSelected,
  accept = 'image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,audio/wav,application/pdf',
  maxSizeMb = 50,
  multiple = true,
  disabled = false,
  className = '',
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const validateFiles = (files: File[]): File[] => {
    const acceptedTypes = accept.split(',').map((t) => t.trim());
    const valid: File[] = [];

    for (const file of files) {
      if (!acceptedTypes.some((type) => file.type === type || type === '*')) {
        setError(`File type not supported: ${file.name}`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        setError(`File too large: ${file.name} (max ${maxSizeMb}MB)`);
        continue;
      }
      valid.push(file);
    }

    return valid;
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const files = validateFiles(Array.from(fileList));
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so re-selecting the same file triggers change
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      <div
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
          disabled
            ? 'cursor-not-allowed border-border bg-inset opacity-50'
            : isDragOver
              ? 'border-primary bg-primary-soft scale-[1.01]'
              : 'border-border bg-surface hover:border-primary/50 hover:bg-primary-soft/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${isDragOver ? 'bg-primary text-primary-fg' : 'bg-primary-soft text-primary'} transition-colors`}>
          <Upload className="h-5 w-5" />
        </div>

        <p className="text-sm font-medium text-heading">
          {isDragOver ? 'Drop files here' : 'Click or drag files to upload'}
        </p>
        <p className="mt-1 text-xs text-muted">
          Photos, videos, audio recordings, and PDFs. Max {maxSizeMb}MB per file.
        </p>
      </div>

      {error && (
        <p className="mt-2 text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
