import React, { useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  RefreshCw,
  RotateCcw,
  ScanSearch,
  Trash2,
  X,
} from 'lucide-react';
import {
  AnalysisStatus,
  ImageValidationError,
  UploadedMealImage,
} from '../types/nutrition';
import { formatFileSize } from '../utils/imageValidation';

interface MealImageUploaderProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadedImage: UploadedMealImage | null;
  validationError: ImageValidationError | null;
  isProcessingFile: boolean;
  analysisStatus: AnalysisStatus;
  onFileSelected: (file: File | null | undefined) => void;
  onRemoveImage: () => void;
  onStartNewMeal: () => void;
  onDismissError: () => void;
  onAnalyzeMeal: () => void;
}

export const MealImageUploader: React.FC<MealImageUploaderProps> = ({
  fileInputRef,
  uploadedImage,
  validationError,
  isProcessingFile,
  analysisStatus,
  onFileSelected,
  onRemoveImage,
  onStartNewMeal,
  onDismissError,
  onAnalyzeMeal,
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    onFileSelected(selectedFile);
    // Reset input value so selecting the same or replacement file triggers onChange reliably
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);

    const droppedFile = event.dataTransfer.files?.[0];
    onFileSelected(droppedFile);
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const isAnalyzing = analysisStatus === 'ANALYZING';
  const hasActiveMealState =
    Boolean(uploadedImage) ||
    analysisStatus !== 'IDLE' ||
    Boolean(validationError);

  return (
    <section
      id="upload-workspace"
      aria-labelledby="upload-heading"
      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-full"
    >
      <div>
        {/* Section Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2
              id="upload-heading"
              className="text-lg font-semibold text-slate-900 font-display"
            >
              01. Meal Photo Capture
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Upload a clear overhead or angled photo of your plate to begin visual logging.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasActiveMealState && (
              <button
                type="button"
                onClick={onStartNewMeal}
                data-testid="start-new-meal-button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Start New Meal</span>
              </button>
            )}
            <div className="text-xs text-slate-500 font-mono whitespace-nowrap shrink-0 hidden sm:block">
              <span>Max 10.00 MB</span>
            </div>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          aria-label="Upload meal photo"
          className="sr-only"
          data-testid="meal-file-input"
        />

        {/* Validation Error Alert */}
        {validationError && (
          <div
            role="alert"
            data-testid="upload-error-banner"
            className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className="w-5 h-5 text-rose-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-rose-950">
                  {validationError.title}
                </p>
                <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                  {validationError.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDismissError}
              aria-label="Dismiss validation error"
              className="p-1.5 text-rose-700 hover:text-rose-950 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Dropzone OR Actual Image Preview */}
        <div className="mt-5">
          {isProcessingFile ? (
            <div
              data-testid="upload-loading-state"
              className="min-h-[300px] rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-8 text-center"
            >
              <Loader2
                className="w-8 h-8 text-slate-700 animate-spin"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-slate-900 mt-3">
                Verifying image file...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Checking format, file size, and browser image dimensions.
              </p>
            </div>
          ) : !uploadedImage ? (
            /* Empty State Before Upload */
            <div
              data-testid="upload-empty-state"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`min-h-[300px] rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center p-6 sm:p-8 text-center ${
                isDraggingOver
                  ? 'border-slate-900 bg-slate-100/70'
                  : 'border-slate-300 bg-slate-50/70 hover:border-slate-400'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                <Camera className="w-6 h-6" aria-hidden="true" />
              </div>

              <h3 className="text-base font-semibold text-slate-900 mt-4 font-display">
                No meal photo selected
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 max-w-sm leading-relaxed">
                Drag and drop a meal image here, or choose a file from your device to inspect the preview before analysis.
              </p>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={triggerFilePicker}
                  data-testid="select-image-button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  <ImagePlus className="w-4 h-4" aria-hidden="true" />
                  <span>Select Image</span>
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                <span>Supported formats: JPG, JPEG, PNG, WebP</span>
                <span aria-hidden="true">·</span>
                <span>Up to 10 MB</span>
              </div>
            </div>
          ) : (
            /* Actual Image Preview State */
            <div data-testid="upload-preview-container" className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[380px]">
                <img
                  src={uploadedImage.previewUrl}
                  alt={`Selected meal preview: ${uploadedImage.fileName}`}
                  referrerPolicy="no-referrer"
                  data-testid="meal-image-preview"
                  className="max-h-[360px] w-auto max-w-full object-contain"
                />
              </div>

              {/* File Metadata & Replace/Remove Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                    <p
                      data-testid="preview-filename"
                      className="text-sm font-semibold text-slate-900 truncate"
                      title={uploadedImage.fileName}
                    >
                      {uploadedImage.fileName}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono mt-1">
                    <span>{formatFileSize(uploadedImage.sizeBytes)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {uploadedImage.width} × {uploadedImage.height} px
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{uploadedImage.mimeType.replace('image/', '').toUpperCase()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={triggerFilePicker}
                    disabled={isAnalyzing}
                    data-testid="replace-image-button"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Replace Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveImage}
                    data-testid="remove-image-button"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary Action Bar: Analyze Meal */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-slate-600">
          {uploadedImage ? (
            <span>
              Image verified and ready for food identification.
            </span>
          ) : (
            <span>
              Select a valid meal photo above to enable meal analysis.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onAnalyzeMeal}
          disabled={!uploadedImage || isProcessingFile || isAnalyzing}
          data-testid="analyze-meal-button"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Analyzing Meal...</span>
            </>
          ) : (
            <>
              <ScanSearch className="w-4 h-4" aria-hidden="true" />
              <span>Analyze Meal</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
