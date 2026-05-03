// FileUploadZone — drag-and-drop file upload area with preview support.

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';

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
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors duration-150 ${
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-50'
            : isDragOver
              ? 'border-teal-500 bg-teal-50'
              : 'border-gray-200 bg-white hover:border-gray-500 hover:bg-gray-100'
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

        <svg
          className="mb-2 h-8 w-8 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>

        <p className="text-sm font-medium text-dark">
          {isDragOver ? 'Drop files here' : 'Click or drag files to upload'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Photos, videos, audio recordings, and PDFs. Max {maxSizeMb}MB per file.
        </p>
      </div>

      {error && (
        <p className="mt-2 text-xs text-critical">{error}</p>
      )}
    </div>
  );
}
