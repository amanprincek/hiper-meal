import { ImageValidationError, UploadedMealImage } from '../types/nutrition';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

/** 10 MB maximum file size limit for meal photos */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function hasAllowedExtension(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function validateMealImageFile(
  file: File | null | undefined
): ImageValidationError | null {
  if (!file) {
    return {
      code: 'NO_FILE_SELECTED',
      title: 'No file selected',
      message: 'Please choose a JPG, JPEG, PNG, or WebP meal photo to continue.',
    };
  }

  if (file.size === 0) {
    return {
      code: 'EMPTY_FILE',
      title: 'Empty file detected',
      message: `The file "${file.name}" contains 0 bytes. Please select a valid meal image.`,
    };
  }

  const normalizedMime = file.type.trim().toLowerCase();
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(
    normalizedMime as (typeof ALLOWED_MIME_TYPES)[number]
  );
  const isExtAllowed = hasAllowedExtension(file.name);

  if (!isMimeAllowed || !isExtAllowed) {
    const reportedType = file.type || 'unknown format';
    return {
      code: 'INVALID_FILE_TYPE',
      title: 'Unsupported file format',
      message: `"${file.name}" (${reportedType}) is not supported. Please upload a JPG, JPEG, PNG, or WebP image.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      code: 'FILE_TOO_LARGE',
      title: 'File exceeds 10 MB limit',
      message: `"${file.name}" is ${formatFileSize(file.size)}. Please choose an image under 10.00 MB.`,
    };
  }

  return null;
}

/**
 * Reads a validated File into a data URL and verifies that the browser can
 * decode its image dimensions, protecting against corrupted or misnamed files.
 */
export function loadAndVerifyImageFile(file: File): Promise<UploadedMealImage> {
  return new Promise((resolve, reject) => {
    const syncError = validateMealImageFile(file);
    if (syncError) {
      reject(syncError);
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      const error: ImageValidationError = {
        code: 'CORRUPTED_IMAGE',
        title: 'Unable to read image file',
        message: `Could not read "${file.name}". The file may be locked or unreadable.`,
      };
      reject(error);
    };

    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl.startsWith('data:image/')) {
        const error: ImageValidationError = {
          code: 'CORRUPTED_IMAGE',
          title: 'Invalid image encoding',
          message: `"${file.name}" could not be decoded as a valid image.`,
        };
        reject(error);
        return;
      }

      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
          const error: ImageValidationError = {
            code: 'CORRUPTED_IMAGE',
            title: 'Invalid image dimensions',
            message: `"${file.name}" has zero width or height and cannot be previewed.`,
          };
          reject(error);
          return;
        }

        resolve({
          file,
          previewUrl: dataUrl,
          fileName: file.name,
          mimeType: file.type.toLowerCase(),
          sizeBytes: file.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
          uploadedAtIso: new Date().toISOString(),
        });
      };

      img.onerror = () => {
        const error: ImageValidationError = {
          code: 'CORRUPTED_IMAGE',
          title: 'Corrupted or unreadable image',
          message: `"${file.name}" has a valid extension but could not be decoded as an image. Please select a different photo.`,
        };
        reject(error);
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}
