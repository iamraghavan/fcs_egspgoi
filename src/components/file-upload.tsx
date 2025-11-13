
"use client";

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { UploadCloud } from 'lucide-react';

type FileUploadProps = {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  accept?: string;
  description?: string;
};

export function FileUpload({ 
  onFileSelect, 
  disabled,
  accept = "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.rar,.7z,video/mp4,video/webm",
  description = "Any document, image or media file (max 10MB)"
}: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFileName(file?.name || null);
    onFileSelect(file);
  }, [onFileSelect]);
  
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    setFileName(file?.name || null);
    onFileSelect(file);
  };

  return (
    <label
      htmlFor="file-upload"
      className={cn(
          "mt-1 flex cursor-pointer justify-center rounded-lg border-2 border-dashed border-border px-6 py-8 transition-colors hover:border-primary/50",
          isDragging && "border-primary bg-primary/10",
          disabled && "cursor-not-allowed opacity-50 bg-muted/50"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="text-center">
        <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
        <div className="mt-2 flex text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Click to upload</span>
            <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-muted-foreground/80 mt-1">
          {description}
        </p>
        {fileName && (
          <p className="text-sm font-medium text-green-600 mt-2 truncate max-w-xs">
            {fileName}
          </p>
        )}
      </div>
      <Input
        id="file-upload"
        name="file-upload"
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </label>
  );
}
