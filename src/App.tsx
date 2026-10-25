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
  FoodCategory,
  ImageValidationError,
  NutritionCandidateMatch,
  UploadedMealImage,
} from './types/nutrition';
import { loadAndVerifyImageFile } from './utils/imageValidation';
import { identifyFoodItemsInMeal } from './services/foodIdentificationService';
import {
  applyCandidateMatchToFoodItem,
  applyLookupResultToFoodItem,
  lookupNutritionPer100g,
} from './services/nutritionLookupService';

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
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [isFoodImage, setIsFoodImage] = useState<boolean | null>(null);
  const [lastAnalyzedAtIso, setLastAnalyzedAtIso] = useState<string | null>(
    null
  );

  const handleTriggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  /**
   * Resolves nutrition for a single food item by ID and updates application state.
   */
  const resolveNutritionForItem = async (itemId: string, foodName: string) => {
    const trimmed = foodName.trim();
    if (!trimmed) {
      setDetectedItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                nutritionStatus: 'UNAVAILABLE',
                nutritionPer100g: undefined,
                nutritionMessage: 'Please enter a valid food name to look up nutrition.',
              }
            : item
        )
      );
      return;
    }

    setDetectedItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              nutritionStatus: 'LOADING',
              nutritionMessage: undefined,
            }
          : item
      )
    );

    try {
      const result = await lookupNutritionPer100g({ foodName: trimmed });
      setDetectedItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? applyLookupResultToFoodItem(item, result) : item
        )
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to look up nutrition data.';
      setDetectedItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                nutritionStatus: 'ERROR',
                nutritionPer100g: undefined,
                nutritionMessage: msg,
              }
            : item
        )
      );
    }
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
      setModelUsed(null);
      setIsFoodImage(null);
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
    setModelUsed(null);
    setIsFoodImage(null);
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

      const itemsLoadingNutrition: DetectedFoodItem[] = response.items.map(
        (item) => ({
          ...item,
          nutritionStatus: 'LOADING',
        })
      );

      setDetectedItems(itemsLoadingNutrition);
      setStatusMessage(response.message);
      setModelUsed(response.modelUsed);
      setIsFoodImage(response.isFoodImage);
      setLastAnalyzedAtIso(response.timestampIso);
      setAnalysisStatus('COMPLETED');

      // Trigger verified nutrition lookup for each detected item concurrently
      await Promise.all(
        itemsLoadingNutrition.map((item) =>
          resolveNutritionForItem(item.id, item.name)
        )
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

  const handleUpdateFoodItem = (
    id: string,
    updates: Partial<
      Pick<DetectedFoodItem, 'name' | 'category' | 'estimatedPortionGrams'>
    >
  ) => {
    setDetectedItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              userCorrected: true,
            }
          : item
      )
    );
  };

  const handleSelectCandidateMatch = (
    itemId: string,
    candidate: NutritionCandidateMatch
  ) => {
    setDetectedItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? applyCandidateMatchToFoodItem(item, candidate)
          : item
      )
    );
  };

  const handleRemoveFoodItem = (id: string) => {
    setDetectedItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const handleAddFoodItem = (newItem: {
    name: string;
    category: FoodCategory;
    estimatedPortionGrams: number;
  }) => {
    const newId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const created: DetectedFoodItem = {
      id: newId,
      name: newItem.name,
      category: newItem.category,
      estimatedPortionGrams: newItem.estimatedPortionGrams,
      identificationNote: 'Added manually by user.',
      userCorrected: true,
      isManuallyAdded: true,
      nutritionStatus: 'LOADING',
    };
    setDetectedItems((prevItems) => [...prevItems, created]);
    void resolveNutritionForItem(newId, newItem.name);
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
              Capture a meal photo, review AI food detections, and calculate verified nutrition totals from the ICMR-NIN Indian reference dataset and Open Food Facts.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span>Phase 3 Verified Nutrition</span>
            <span aria-hidden="true">·</span>
            <span>ICMR-NIN & Open Food Facts</span>
            <span aria-hidden="true">·</span>
            <span>Live Macro Scaling</span>
          </div>
        </section>

        {/* Primary 2-Column Workspace: Upload & Preview (Left) + Editable Detection & Nutrition Review (Right) */}
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
              modelUsed={modelUsed}
              isFoodImage={isFoodImage}
              lastAnalyzedAtIso={lastAnalyzedAtIso}
              onSelectPhotoClick={handleTriggerFileSelect}
              onRetryAnalysis={handleAnalyzeMeal}
              onUpdateFoodItem={handleUpdateFoodItem}
              onLookupItemNutrition={resolveNutritionForItem}
              onSelectCandidateMatch={handleSelectCandidateMatch}
              onRemoveFoodItem={handleRemoveFoodItem}
              onAddFoodItem={handleAddFoodItem}
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
            Nutrition data sourced from ICMR-NIN IFCT 2017 / USDA FDC and Open Food Facts (ODbL). Visual category colors are for grouping only.
          </span>
        </div>
      </footer>
    </div>
  );
}
