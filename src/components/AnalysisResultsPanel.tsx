import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileImage,
  Info,
  Layers,
  Loader2,
  UtensilsCrossed,
} from 'lucide-react';
import {
  AnalysisStatus,
  DetectedFoodItem,
  FOOD_CATEGORY_TAXONOMY,
  UploadedMealImage,
} from '../types/nutrition';
import { formatFileSize } from '../utils/imageValidation';
import { aggregateMealNutrition } from '../utils/nutritionCalculator';

interface AnalysisResultsPanelProps {
  status: AnalysisStatus;
  uploadedImage: UploadedMealImage | null;
  detectedItems: DetectedFoodItem[];
  statusMessage: string | null;
  errorMessage: string | null;
  lastAnalyzedAtIso: string | null;
  onSelectPhotoClick: () => void;
}

export const AnalysisResultsPanel: React.FC<AnalysisResultsPanelProps> = ({
  status,
  uploadedImage,
  detectedItems,
  statusMessage,
  errorMessage,
  lastAnalyzedAtIso,
  onSelectPhotoClick,
}) => {
  const summary = aggregateMealNutrition(detectedItems);

  return (
    <section
      id="results-workspace"
      aria-labelledby="results-heading"
      className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-full"
    >
      <div>
        {/* Section Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2
              id="results-heading"
              className="text-lg font-semibold text-slate-900 font-display"
            >
              02. Food Identification & Nutrition Reserve
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Reserved workspace for detected food items, manual corrections, and macro calculations.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono whitespace-nowrap shrink-0">
            <span>{summary.itemCount} items logged</span>
          </div>
        </div>

        {/* Dynamic Workspace Body */}
        <div className="mt-5">
          {status === 'IDLE' && (
            <div
              data-testid="results-idle-state"
              className="min-h-[300px] rounded-xl border border-slate-200 bg-slate-50/60 p-8 flex flex-col items-center justify-center text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                <UtensilsCrossed className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-4 font-display">
                Awaiting Meal Photo
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 max-w-md leading-relaxed">
                Upload a meal photo in the capture panel first. Once analyzed, identified ingredients, portion weights, and nutrition estimates will populate this section.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={onSelectPhotoClick}
                  className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Choose a Photo to Begin
                </button>
              </div>
            </div>
          )}

          {status === 'READY_TO_ANALYZE' && uploadedImage && (
            <div
              data-testid="results-ready-state"
              className="min-h-[300px] rounded-xl border border-slate-200 bg-slate-50/60 p-8 flex flex-col items-center justify-center text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <FileImage className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-4 font-display">
                Photo Verified & Staged
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 max-w-md leading-relaxed">
                <span className="font-semibold text-slate-800">
                  {uploadedImage.fileName}
                </span>{' '}
                ({uploadedImage.width} × {uploadedImage.height} px,{' '}
                {formatFileSize(uploadedImage.sizeBytes)}) is loaded. Click{' '}
                <span className="font-semibold text-slate-900">Analyze Meal</span>{' '}
                to test the food-identification service boundary.
              </p>
            </div>
          )}

          {status === 'ANALYZING' && (
            <div
              data-testid="results-loading-state"
              className="min-h-[300px] rounded-xl border border-slate-200 bg-slate-50/60 p-6 flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <Loader2
                  className="w-5 h-5 text-emerald-600 animate-spin shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Dispatching meal image to identification service boundary...
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Validating image payload and preparing detection workspace.
                  </p>
                </div>
              </div>

              {/* Clean Skeleton Rows */}
              <div className="space-y-3 my-6" aria-hidden="true">
                <div className="h-10 bg-slate-200/70 rounded-lg animate-pulse" />
                <div className="h-10 bg-slate-200/70 rounded-lg animate-pulse" />
                <div className="h-10 bg-slate-200/70 rounded-lg animate-pulse" />
              </div>

              <div className="text-xs text-slate-400 font-mono">
                <span>Processing image buffer...</span>
              </div>
            </div>
          )}

          {status === 'ERROR' && (
            <div
              role="alert"
              data-testid="results-error-state"
              className="min-h-[300px] rounded-xl border border-rose-200 bg-rose-50/60 p-8 flex flex-col items-center justify-center text-center"
            >
              <AlertTriangle
                className="w-8 h-8 text-rose-600"
                aria-hidden="true"
              />
              <h3 className="text-base font-semibold text-rose-950 mt-3 font-display">
                Analysis Request Failed
              </h3>
              <p className="text-xs text-rose-800 mt-1.5 max-w-md leading-relaxed">
                {errorMessage ||
                  'An unexpected error occurred while processing the meal image.'}
              </p>
            </div>
          )}

          {(status === 'PHASE_1_BOUNDARY' || status === 'COMPLETED') && (
            <div
              data-testid="results-boundary-state"
              className="space-y-4"
            >
              {/* Service Boundary Status Notice */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Info
                  className="w-5 h-5 text-slate-700 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Phase 1 Foundation Verified
                    </span>
                    {lastAnalyzedAtIso && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-500">
                          {new Date(lastAnalyzedAtIso).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-1">{statusMessage}</p>
                  {uploadedImage && (
                    <div className="mt-2 pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2 font-mono text-slate-500">
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Verified payload: {uploadedImage.fileName}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {uploadedImage.width}×{uploadedImage.height}px
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{formatFileSize(uploadedImage.sizeBytes)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reserved Detection Table Structure (Zero Fabricated Items) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Detected Food Items</span>
                  <span>Category & Portion Reserve</span>
                </div>

                {detectedItems.length === 0 ? (
                  <div
                    data-testid="empty-detections-placeholder"
                    className="p-6 text-center bg-white"
                  >
                    <Layers
                      className="w-5 h-5 text-slate-400 mx-auto"
                      aria-hidden="true"
                    />
                    <p className="text-xs font-semibold text-slate-800 mt-2">
                      No fabricated detections displayed
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      This table is reserved for real AI food-identification output and interactive user corrections in the next implementation phase.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {detectedItems.map((item) => {
                      const cat = FOOD_CATEGORY_TAXONOMY[item.category];
                      return (
                        <div
                          key={item.id}
                          className="px-4 py-3 flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-sm ${cat.swatchClass}`}
                              aria-hidden="true"
                            />
                            <span className="font-medium text-slate-900">
                              {item.name}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span className="text-xs text-slate-500">
                              {cat.label}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-slate-700">
                            {item.estimatedPortionGrams} g
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reserved Nutrition Summary Footer */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span className="font-semibold text-slate-700">
            Estimated Meal Totals (Reserved)
          </span>
          <span className="font-mono">
            Total Weight: {summary.totalWeightGrams} g
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 block">Calories</span>
            <span className="text-base font-semibold text-slate-900 font-mono mt-0.5 block">
              {detectedItems.length > 0 ? `${summary.totals.caloriesKcal} kcal` : '— kcal'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 block">Protein</span>
            <span className="text-base font-semibold text-slate-900 font-mono mt-0.5 block">
              {detectedItems.length > 0 ? `${summary.totals.proteinGrams} g` : '— g'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 block">Carbohydrates</span>
            <span className="text-base font-semibold text-slate-900 font-mono mt-0.5 block">
              {detectedItems.length > 0 ? `${summary.totals.carbsGrams} g` : '— g'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 block">Total Fat</span>
            <span className="text-base font-semibold text-slate-900 font-mono mt-0.5 block">
              {detectedItems.length > 0 ? `${summary.totals.fatGrams} g` : '— g'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
