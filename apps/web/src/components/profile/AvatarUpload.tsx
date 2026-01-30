'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (newAvatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

export function AvatarUpload({ 
  currentAvatarUrl, 
  onUploadSuccess,
  size = 'lg' 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onUploadSuccess?.(result.data.avatarUrl);
      } else {
        setError(result.error?.message || 'Upload failed');
        setPreviewUrl(null);
      }
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div 
          className={`${sizeClasses[size]} rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border`}
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Profile photo"
              fill
              className="object-cover"
            />
          ) : (
            <User className="h-1/2 w-1/2 text-muted-foreground" />
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Click the camera icon to upload a photo
      </p>
    </div>
  );
}
