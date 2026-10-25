/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Header } from './components/Header';
import { MealImageUploader } from './components/MealImageUploader';
import { AnalysisResultsPanel } from './components/AnalysisResultsPanel';
import { CategoryTypeLegend } from './components/CategoryTypeLegend';
import {
  AnalysisStatus,
  DetectedFoodItem,
  ImageValidationError,
  UploadedMealImage,
} from './types/nutrition';
import { loadAndVerifyImageFile } from './utils/imageValidation';
import { identifyFoodItemsInMeal } from './services/foodIdentificationService';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadedImage, setUploadedImage] = useState<UploadedMealImage | null>(
    null
  );
  const [validationError, setValidationError] =
    useState<ImageValidationError | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('IDLE');
  const [detectedItems, setDetectedItems] = useState<DetectedFoodItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastAnalyzedAtIso, setLastAnalyzedAtIso] = useState<string | null>(
    null
  );

  const handleTriggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (file: File | null | undefined) => {
    if (!file) {
      return;
    }

    setValidationError(null);
    setAnalysisError(null);
    setIsProcessingFile(true);

    try {
      const verifiedImage = await loadAndVerifyImageFile(file);
      setUploadedImage(verifiedImage);
      setDetectedItems([]);
      setStatusMessage(null);
      setAnalysisStatus('READY_TO_ANALYZE');
    } catch (err) {
      const structuredErr = err as ImageValidationError;
      if (structuredErr && structuredErr.code && structuredErr.message) {
        setValidationError(structuredErr);
      } else {
        setValidationError({
          code: 'CORRUPTED_IMAGE',
          title: 'Invalid image file',
          message:
            'The selected file could not be validated. Please choose a valid JPG, JPEG, PNG, or WebP image.',
        });
      }
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setValidationError(null);
    setDetectedItems([]);
    setStatusMessage(null);
    setAnalysisError(null);
    setLastAnalyzedAtIso(null);
    setAnalysisStatus('IDLE');
  };

  const handleDismissError = () => {
    setValidationError(null);
  };

  const handleAnalyzeMeal = async () => {
    if (!uploadedImage) {
      setValidationError({
        code: 'NO_FILE_SELECTED',
        title: 'No meal image selected',
        message: 'Please select a valid meal photo before running analysis.',
      });
      return;
    }

    setValidationError(null);
    setAnalysisError(null);
    setAnalysisStatus('ANALYZING');

    try {
      const response = await identifyFoodItemsInMeal({
        image: uploadedImage,
      });

      setDetectedItems(response.items);
      setStatusMessage(response.message);
      setLastAnalyzedAtIso(response.timestampIso);
      setAnalysisStatus(
        response.status === 'PHASE_1_BOUNDARY_REACHED'
          ? 'PHASE_1_BOUNDARY'
          : 'COMPLETED'
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to analyze the selected meal image.';
      setAnalysisError(message);
      setAnalysisStatus('ERROR');
    }
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation Bar */}
      <Header onTriggerFileSelect={handleTriggerFileSelect} />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Dashboard Hero / Intro Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display text-balance">
              AI Visual Nutrition Diary
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1.5 leading-relaxed">
              Capture a meal photo, verify food detections with Pokémon-type-inspired category markers, and estimate nutritional totals in one streamlined workspace.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span>Phase 1 Foundation</span>
            <span aria-hidden="true">·</span>
            <span>JPG, JPEG, PNG, WebP</span>
            <span aria-hidden="true">·</span>
            <span>Client-Validated Preview</span>
          </div>
        </section>

        {/* Primary 2-Column Workspace: Upload & Preview (Left) + Reserved Detection Results (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6">
            <MealImageUploader
              fileInputRef={fileInputRef}
              uploadedImage={uploadedImage}
              validationError={validationError}
              isProcessingFile={isProcessingFile}
              analysisStatus={analysisStatus}
              onFileSelected={handleFileSelected}
              onRemoveImage={handleRemoveImage}
              onDismissError={handleDismissError}
              onAnalyzeMeal={handleAnalyzeMeal}
            />
          </div>

          <div className="lg:col-span-6">
            <AnalysisResultsPanel
              status={analysisStatus}
              uploadedImage={uploadedImage}
              detectedItems={detectedItems}
              statusMessage={statusMessage}
              errorMessage={analysisError}
              lastAnalyzedAtIso={lastAnalyzedAtIso}
              onSelectPhotoClick={handleTriggerFileSelect}
            />
          </div>
        </div>

        {/* Pokémon-Type-Inspired Food Category Taxonomy Reference */}
        <CategoryTypeLegend />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>HiperMeal — Visual Nutrition Diary</span>
          <span>
            Visual category accents are for grouping only and do not infer nutritional values.
          </span>
        </div>
      </footer>
    </div>
  );
}
