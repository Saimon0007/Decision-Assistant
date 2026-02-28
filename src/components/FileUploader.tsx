import React, { useCallback, useState } from 'react';
import { UploadCloud, X, FileText, FileSpreadsheet, FileImage, File } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
}

export function FileUploader({ onFilesSelected, selectedFiles, onRemoveFile, disabled }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelected, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  }, [onFilesSelected]);

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="text-red-500" size={20} />;
    if (type.includes('csv') || type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="text-green-500" size={20} />;
    if (type.includes('image')) return <FileImage className="text-purple-500" size={20} />;
    return <File className="text-slate-400" size={20} />;
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 transition-all text-center cursor-pointer",
          isDragging 
            ? "border-indigo-500 bg-indigo-50" 
            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50",
          disabled && "opacity-50 cursor-not-allowed hover:border-slate-200 hover:bg-transparent"
        )}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          disabled={disabled}
          accept=".csv,.pdf,.txt,.md,.json,.jpg,.jpeg,.png,.webp"
        />
        <label htmlFor="file-upload" className={cn("cursor-pointer w-full h-full block", disabled && "cursor-not-allowed")}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <UploadCloud size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
                CSV, PDF, Excel, Images (max 10MB)
              </p>
            </div>
          </div>
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Attached Files ({selectedFiles.length})
          </p>
          <div className="grid grid-cols-1 gap-2">
            {selectedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {getFileIcon(file.type)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveFile(index)}
                  disabled={disabled}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
