'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, File, Loader2, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { API_BASE_URL } from '@/lib/api';

interface FileUploadProps {
  onUploadComplete: (result: UploadResult) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSizeMB?: number;
  folder?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
}

interface UploadResult {
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

const FILE_ICONS: Record<string, any> = {
  'image': Image,
  'application/pdf': FileText,
  'default': File,
};

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FILE_ICONS['image'];
  if (mimeType === 'application/pdf') return FILE_ICONS['application/pdf'];
  return FILE_ICONS['default'];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  onUploadComplete,
  onError,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif',
  maxSizeMB = 10,
  folder = 'documents',
  label = 'Upload File',
  description = 'Drag and drop or click to select',
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedResult, setUploadedResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled]);

  const handleFileSelect = async (file: File) => {
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      onError?.(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setSelectedFile(file);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('accessToken');
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      // Simulate progress (since fetch doesn't support progress natively)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload-file`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      const data = await res.json();

      if (data.success) {
        setUploadProgress(100);
        const result: UploadResult = {
          url: data.data.url,
          publicId: data.data.publicId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        };
        setUploadedResult(result);
        onUploadComplete(result);
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      onError?.(error.message || 'Failed to upload file');
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadedResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const FileIcon = selectedFile ? getFileIcon(selectedFile.type) : Upload;

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {!selectedFile ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Max size: {maxSizeMB}MB
          </p>
        </div>
      ) : (
        <div className="border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`
              h-10 w-10 rounded-lg flex items-center justify-center
              ${uploadedResult ? 'bg-green-100' : 'bg-muted'}
            `}>
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : uploadedResult ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <FileIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
                {uploadedResult && ' • Uploaded successfully'}
              </p>
            </div>

            {!isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isUploading && (
            <div className="mt-3">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
