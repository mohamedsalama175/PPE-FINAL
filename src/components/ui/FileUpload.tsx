import * as React from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FileUploadProps {
  label?: string;
  required?: boolean;
  withAsterisk?: boolean;
  error?: string;
  helperText?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  maxFiles?: number;
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

export function FileUpload({
  label,
  required,
  withAsterisk,
  error,
  helperText,
  accept = 'image/*,application/pdf',
  multiple = false,
  maxSizeMB = 10,
  maxFiles = 5,
  files = [],
  onFilesChange,
  disabled = false,
  className,
  containerClassName,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const showRequiredIndicator = required || withAsterisk;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setInternalError(null);
    const newFilesList: File[] = multiple ? [...files] : [];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];

      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        setInternalError(`File "${file.name}" exceeds the maximum size limit of ${maxSizeMB}MB.`);
 return;
 }

 if (multiple && newFilesList.length >= maxFiles) {
 setInternalError(`Cannot upload more than ${maxFiles} files.`);
        return;
      }

      newFilesList.push(file);
    }

    if (onFilesChange) {
      onFilesChange(newFilesList);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    if (onFilesChange) onFilesChange(updated);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('w-full flex flex-col', containerClassName)}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          {label}
          {showRequiredIndicator && (
            <span className="text-danger ms-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Dropzone container */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'w-full p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 select-none',
          isDragActive
            ? 'border-primary bg-primary-light/30 ring-2 ring-primary/20 '
            : 'border-[#E2E8F0] bg-white hover:border-primary hover:bg-primary-light/10 ',
          disabled ? 'cursor-not-allowed opacity-50 bg-[#F5F6FD] ' : '',
          className
        )}
      >
        <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>

        <p className="text-sm font-semibold text-[#1E293B] ">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-[#8A9AAF] mt-1">
          {accept.replace(/\/\*/g, '')} (max. {maxSizeMB}MB)
        </p>
      </div>

      {(error || internalError) && (
        <p role="alert" className="text-xs text-danger font-medium mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error || internalError}</span>
        </p>
      )}

      {helperText && !error && !internalError && (
        <p className="text-xs text-[#8A9AAF] mt-1.5 font-normal">
          {helperText}
        </p>
      )}

      {/* Uploaded files preview list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, idx) => {
            const isImage = file.type.startsWith('image/');
            return (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] bg-white "
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded bg-primary-light text-primary shrink-0">
                    {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1E293B] truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-[#8A9AAF] font-mono">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className="p-1 rounded text-slate-400 hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
