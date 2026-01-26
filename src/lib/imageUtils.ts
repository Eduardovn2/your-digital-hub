/**
 * Image optimization utilities for better performance
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg';
}

/**
 * Compress and resize an image file before upload
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const extension = format === 'webp' ? 'webp' : 'jpg';
          const newFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, `.${extension}`),
            { type: `image/${format}` }
          );

          resolve(newFile);
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  url: string,
  widths: number[] = [320, 640, 960, 1280]
): string {
  // For Supabase storage, we can use transform parameters
  if (url.includes('supabase.co/storage')) {
    return widths
      .map((w) => `${url}?width=${w} ${w}w`)
      .join(', ');
  }
  
  // For other URLs, return original
  return url;
}

/**
 * Get optimized image URL with dimensions
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number
): string {
  if (!url) return '/placeholder.svg';
  
  // For Supabase storage, add transform parameters
  if (url.includes('supabase.co/storage')) {
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    
    const separator = url.includes('?') ? '&' : '?';
    return params.toString() ? `${url}${separator}${params.toString()}` : url;
  }
  
  return url;
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
}
