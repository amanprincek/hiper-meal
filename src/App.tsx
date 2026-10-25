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
  const mealSessionRef = useRef<number>(0);
  const activeAbortControllersRef = useRef<Set<AbortController>>(new Set());
  const lookupTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );

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

  const abortAllInFlightRequests = () => {
    activeAbortControllersRef.current.forEach((controller) => {
      try {
        controller.abort();
      } catch {
        // Ignore abort errors
      }
    });
    activeAbortControllersRef.current.clear();

    Object.values(lookupTimersRef.current).forEach((timerId) => {
      clearTimeout(timerId);
    });
    lookupTimersRef.current = {};
  };

  const handleTriggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  /**
   * Resolves nutrition for a single food item by ID and updates application state.
   * Respects mealSessionRef so late responses never repopulate a reset meal.
   */
  const resolveNutritionForItem = async (itemId: string, foodName: string) => {
    if (lookupTimersRef.current[itemId]) {
      clearTimeout(lookupTimersRef.current[itemId]);
      delete lookupTimersRef.current[itemId];
    }

    const sessionId = mealSessionRef.current;
    const trimmed = foodName.trim();
    if (!trimmed) {
      setDetectedItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                nutritionStatus: 'UNAVAILABLE',
                nutritionPer100g: undefined,
                nutritionSourceType: undefined,
                nutritionSourceLabel: 'Nutrition Data Unavailable',
                matchedRecordId: undefined,
                matchedFoodDescription: undefined,
                preparationAssumptions: undefined,
                candidateMatches: undefined,
                nutritionMessage:
                  'Please enter a valid food name to look up nutrition.',
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

    const controller = new AbortController();
    activeAbortControllersRef.current.add(controller);

    try {
      const result = await lookupNutritionPer100g({
        foodName: trimmed,
        signal: controller.signal,
      });

      if (sessionId !== mealSessionRef.current || controller.signal.aborted) {
        return;
      }

      setDetectedItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? applyLookupResultToFoodItem(item, result) : item
        )
      );
    } catch (err) {
      if (sessionId !== mealSessionRef.current || controller.signal.aborted) {
        return;
      }
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
    } finally {
      activeAbortControllersRef.current.delete(controller);
    }
  };

  const handleFileSelected = async (file: File | null | undefined) => {
    if (!file) {
      return;
    }

    abortAllInFlightRequests();
    mealSessionRef.current += 1;
    const sessionId = mealSessionRef.current;

    setValidationError(null);
    setAnalysisError(null);
    setIsProcessingFile(true);

    try {
      const verifiedImage = await loadAndVerifyImageFile(file);
      if (sessionId !== mealSessionRef.current) {
        return;
      }
      setUploadedImage(verifiedImage);
      setDetectedItems([]);
      setStatusMessage(null);
      setModelUsed(null);
      setIsFoodImage(null);
      setLastAnalyzedAtIso(null);
      setAnalysisStatus('READY_TO_ANALYZE');
    } catch (err) {
      if (sessionId !== mealSessionRef.current) {
        return;
      }
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
      if (sessionId === mealSessionRef.current) {
        setIsProcessingFile(false);
      }
    }
  };

  /**
   * Full Meal Reset ("Start New Meal"):
   * Cancels any in-flight AI or nutrition requests, clears the file input,
   * clears image preview, items, nutrition results, and errors, and returns to IDLE.
   */
  const handleStartNewMeal = () => {
    mealSessionRef.current += 1;
    abortAllInFlightRequests();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setUploadedImage(null);
    setValidationError(null);
    setIsProcessingFile(false);
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

    abortAllInFlightRequests();
    mealSessionRef.current += 1;
    const sessionId = mealSessionRef.current;
    const controller = new AbortController();
    activeAbortControllersRef.current.add(controller);

    setValidationError(null);
    setAnalysisError(null);
    setAnalysisStatus('ANALYZING');

    try {
      const response = await identifyFoodItemsInMeal({
        image: uploadedImage,
        signal: controller.signal,
      });

      if (sessionId !== mealSessionRef.current || controller.signal.aborted) {
        return;
      }

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
      if (sessionId !== mealSessionRef.current || controller.signal.aborted) {
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to analyze the selected meal image.';
      setAnalysisError(message);
      setAnalysisStatus('ERROR');
    } finally {
      activeAbortControllersRef.current.delete(controller);
    }
  };

  const handleUpdateFoodItem = (
    id: string,
    updates: Partial<
      Pick<DetectedFoodItem, 'name' | 'category' | 'estimatedPortionGrams'>
    >
  ) => {
    let shouldScheduleLookup = false;
    let updatedName = '';

    setDetectedItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const nameChanged =
          updates.name !== undefined && updates.name !== item.name;
        if (nameChanged) {
          shouldScheduleLookup = true;
          updatedName = updates.name ?? '';
        }

        return {
          ...item,
          ...updates,
          userCorrected: true,
          ...(nameChanged
            ? {
                nutritionStatus: updatedName.trim() ? 'LOADING' : 'UNAVAILABLE',
                nutritionPer100g: undefined,
                nutritionSourceType: undefined,
                nutritionSourceLabel: undefined,
                matchedRecordId: undefined,
                matchedFoodDescription: undefined,
                preparationAssumptions: undefined,
                candidateMatches: undefined,
                nutritionMessage: updatedName.trim()
                  ? undefined
                  : 'Please enter a valid food name to look up nutrition.',
              }
            : {}),
        };
      })
    );

    if (shouldScheduleLookup) {
      if (lookupTimersRef.current[id]) {
        clearTimeout(lookupTimersRef.current[id]);
      }
      const trimmed = updatedName.trim();
      if (trimmed) {
        lookupTimersRef.current[id] = setTimeout(() => {
          void resolveNutritionForItem(id, trimmed);
        }, 300);
      }
    }
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
    if (lookupTimersRef.current[id]) {
      clearTimeout(lookupTimersRef.current[id]);
      delete lookupTimersRef.current[id];
    }
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

  const hasActiveMeal =
    Boolean(uploadedImage) ||
    analysisStatus !== 'IDLE' ||
    Boolean(validationError) ||
    detectedItems.length > 0;

  return (
    <div
      id="top"
      className="min-h-screen flex flex-col bg-[#FAF9F5] text-zinc-900"
    >
      {/* Top Navigation Bar */}
      <Header
        analysisStatus={analysisStatus}
        hasActiveMeal={hasActiveMeal}
        onTriggerFileSelect={handleTriggerFileSelect}
        onStartNewMeal={handleStartNewMeal}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Compact Dashboard Intro Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-1">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-display text-balance">
              Visual Meal &amp; Nutrition Diary
            </h1>
            <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
              Snap or upload a meal photo, verify AI-identified ingredients and portion weights, and calculate estimated macros from ICMR-NIN Indian reference tables and Open Food Facts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 shrink-0">
            <span className="text-emerald-900 font-medium">
              Verified Nutrition References
            </span>
            <span aria-hidden="true">·</span>
            <span>ICMR-NIN &amp; Open Food Facts</span>
            <span aria-hidden="true">·</span>
            <span>Editable Portions</span>
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
              onRemoveImage={handleStartNewMeal}
              onStartNewMeal={handleStartNewMeal}
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
              onStartNewMeal={handleStartNewMeal}
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
      <footer className="border-t border-[#E5E4DF] bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <span>HiperMeal — AI Visual Nutrition Diary</span>
          <span>
            Nutrition data sourced from ICMR-NIN IFCT 2017 / USDA FDC and Open Food Facts (ODbL). Visual category colors are for grouping only.
          </span>
        </div>
      </footer>
    </div>
  );
}
