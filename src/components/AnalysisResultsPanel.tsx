import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileImage,
  HelpCircle,
  Info,
  Layers,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import {
  ALL_FOOD_CATEGORIES,
  AnalysisStatus,
  DetectedFoodItem,
  FOOD_CATEGORY_TAXONOMY,
  FoodCategory,
  NutritionCandidateMatch,
  UploadedMealImage,
} from '../types/nutrition';
import { formatFileSize } from '../utils/imageValidation';
import {
  aggregateMealNutrition,
  calculateItemNutrition,
  sanitizePortionGrams,
} from '../utils/nutritionCalculator';

interface AnalysisResultsPanelProps {
  status: AnalysisStatus;
  uploadedImage: UploadedMealImage | null;
  detectedItems: DetectedFoodItem[];
  statusMessage: string | null;
  errorMessage: string | null;
  modelUsed: string | null;
  isFoodImage: boolean | null;
  lastAnalyzedAtIso: string | null;
  onSelectPhotoClick: () => void;
  onRetryAnalysis: () => void;
  onStartNewMeal: () => void;
  onUpdateFoodItem: (
    id: string,
    updates: Partial<
      Pick<DetectedFoodItem, 'name' | 'category' | 'estimatedPortionGrams'>
    >
  ) => void;
  onLookupItemNutrition: (id: string, foodName: string) => void;
  onSelectCandidateMatch: (
    itemId: string,
    candidate: NutritionCandidateMatch
  ) => void;
  onRemoveFoodItem: (id: string) => void;
  onAddFoodItem: (item: {
    name: string;
    category: FoodCategory;
    estimatedPortionGrams: number;
  }) => void;
}

function formatNutrientValue(
  val: number | null | undefined,
  unit: string
): string {
  if (val === null || val === undefined || !Number.isFinite(val)) {
    return 'N/A';
  }
  return `${val} ${unit}`;
}

export const AnalysisResultsPanel: React.FC<AnalysisResultsPanelProps> = ({
  status,
  uploadedImage,
  detectedItems,
  statusMessage,
  errorMessage,
  modelUsed,
  isFoodImage,
  lastAnalyzedAtIso,
  onSelectPhotoClick,
  onRetryAnalysis,
  onStartNewMeal,
  onUpdateFoodItem,
  onLookupItemNutrition,
  onSelectCandidateMatch,
  onRemoveFoodItem,
  onAddFoodItem,
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<FoodCategory>(
    FoodCategory.PRODUCE
  );
  const [newItemPortion, setNewItemPortion] = useState<string>('100');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (status === 'IDLE') {
      setShowAddForm(false);
      setNewItemName('');
      setNewItemCategory(FoodCategory.PRODUCE);
      setNewItemPortion('100');
    }
  }, [status]);

  const summary = aggregateMealNutrition(detectedItems);

  const handleCreateManualItem = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = newItemName.trim() || 'Custom Food Item';
    const parsedPortion = Number(newItemPortion);
    const safePortion =
      Number.isFinite(parsedPortion) && parsedPortion > 0
        ? sanitizePortionGrams(parsedPortion)
        : 100;

    onAddFoodItem({
      name: trimmedName,
      category: newItemCategory,
      estimatedPortionGrams: safePortion,
    });

    setNewItemName('');
    setNewItemPortion('100');
    setShowAddForm(false);
  };

  return (
    <section
      id="results-workspace"
      aria-labelledby="results-heading"
      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-full"
    >
      <div>
        {/* Section Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2
              id="results-heading"
              className="text-lg font-semibold text-slate-900 font-display"
            >
              02. Food Identification & Nutrition Review
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Inspect AI-detected items, verify reference nutrition sources, and adjust serving weights.
            </p>
          </div>
          <div
            data-testid="logged-item-count"
            className="text-xs text-slate-500 font-mono whitespace-nowrap shrink-0"
          >
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
                Upload a meal photo in the capture panel first. Once analyzed, identified ingredients, editable serving weights, and verified nutrition profiles (ICMR-NIN Indian Dataset & Open Food Facts) will populate here.
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
                Photo Verified & Ready for AI Analysis
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 max-w-md leading-relaxed">
                <span className="font-semibold text-slate-800">
                  {uploadedImage.fileName}
                </span>{' '}
                ({uploadedImage.width} × {uploadedImage.height} px,{' '}
                {formatFileSize(uploadedImage.sizeBytes)}) is staged. Click{' '}
                <span className="font-semibold text-slate-900">Analyze Meal</span>{' '}
                to identify food items and look up verified nutrition records.
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
                    Analyzing meal photo with vision model...
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Identifying dishes, food categories, and approximate portion estimates.
                  </p>
                </div>
              </div>

              {/* Clean Skeleton Rows */}
              <div className="space-y-3 my-6" aria-hidden="true">
                <div className="h-14 bg-slate-200/70 rounded-xl animate-pulse" />
                <div className="h-14 bg-slate-200/70 rounded-xl animate-pulse" />
                <div className="h-14 bg-slate-200/70 rounded-xl animate-pulse" />
              </div>

              <div className="text-xs text-slate-400 font-mono">
                <span>Awaiting structured model response...</span>
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
              <p
                data-testid="results-error-message"
                className="text-xs text-rose-800 mt-1.5 max-w-md leading-relaxed"
              >
                {errorMessage ||
                  'An unexpected error occurred while processing the meal image.'}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onRetryAnalysis}
                  data-testid="retry-analysis-button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Retry Analysis</span>
                </button>
                <button
                  type="button"
                  onClick={onStartNewMeal}
                  data-testid="error-start-new-meal-button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Start New Meal</span>
                </button>
              </div>
            </div>
          )}

          {(status === 'COMPLETED' || status === 'PHASE_1_BOUNDARY') && (
            <div data-testid="results-completed-state" className="space-y-4">
              {/* Analysis Summary Header Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Info
                    className="w-4 h-4 text-slate-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <div className="flex flex-wrap items-center gap-2 text-slate-500">
                      <span className="font-semibold text-slate-900">
                        {isFoodImage === false
                          ? 'No Recognizable Food Identified'
                          : 'AI Visual Analysis & Nutrition Lookup'}
                      </span>
                      {modelUsed && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{modelUsed}</span>
                        </>
                      )}
                      {lastAnalyzedAtIso && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">
                            {new Date(lastAnalyzedAtIso).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    {statusMessage && (
                      <p
                        data-testid="analysis-overall-note"
                        className="mt-1 text-slate-700"
                      >
                        {statusMessage}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Portion weights (~g) are visual estimates, and nutrition values come strictly from documented reference tables or Open Food Facts (never AI-invented).
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Toolbar: Add Food Item Manually + Start New Meal */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-700">
                  Detected & Logged Items ({detectedItems.length})
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm((prev) => !prev)}
                    data-testid="toggle-add-food-button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{showAddForm ? 'Cancel Add' : 'Add Food Item'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onStartNewMeal}
                    data-testid="results-start-new-meal-button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Start New Meal</span>
                  </button>
                </div>
              </div>

              {/* Manual Add Food Item Form */}
              {showAddForm && (
                <form
                  onSubmit={handleCreateManualItem}
                  data-testid="manual-add-food-form"
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <p className="text-xs font-semibold text-slate-900">
                    Add Missing Food Item Manually
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Food Name
                      </label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g., Whole-Wheat Roti or Plain Curd"
                        required
                        data-testid="new-food-name-input"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-2 focus:outline-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Category
                      </label>
                      <select
                        value={newItemCategory}
                        onChange={(e) =>
                          setNewItemCategory(e.target.value as FoodCategory)
                        }
                        data-testid="new-food-category-select"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-2 focus:outline-slate-900"
                      >
                        {ALL_FOOD_CATEGORIES.map((catKey) => {
                          const meta = FOOD_CATEGORY_TAXONOMY[catKey];
                          return (
                            <option key={catKey} value={catKey}>
                              {meta.label} ({meta.typeInspiration})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Serving Size (g)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5000}
                        step={1}
                        value={newItemPortion}
                        onChange={(e) => setNewItemPortion(e.target.value)}
                        data-testid="new-food-portion-input"
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-2 focus:outline-slate-900"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      data-testid="confirm-add-food-button"
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Save Item & Lookup Nutrition
                    </button>
                  </div>
                </form>
              )}

              {/* Editable Food Items List OR Empty Unclear Image State */}
              {detectedItems.length === 0 ? (
                <div
                  data-testid="empty-detections-placeholder"
                  className="p-8 rounded-xl border border-slate-200 text-center bg-slate-50/40"
                >
                  <Layers
                    className="w-6 h-6 text-slate-400 mx-auto"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-slate-800 mt-2.5 font-display">
                    No food items currently in this meal list
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                    {isFoodImage === false
                      ? 'The vision model could not reliably identify food in this image. You can add items manually using "Add Food Item" above or upload a clearer photo.'
                      : 'All items were removed or none were detected. Click "Add Food Item" above to log items manually.'}
                  </p>
                </div>
              ) : (
                <div
                  data-testid="detected-items-list"
                  className="space-y-3.5 max-h-[540px] overflow-y-auto pr-1"
                >
                  {detectedItems.map((item, index) => {
                    const cat = FOOD_CATEGORY_TAXONOMY[item.category];
                    const confidencePercent =
                      item.confidenceScore !== undefined
                        ? `${Math.round(item.confidenceScore * 100)}% confidence`
                        : null;

                    const scaledMacros = calculateItemNutrition(
                      item.nutritionPer100g,
                      item.estimatedPortionGrams
                    );

                    return (
                      <div
                        key={item.id}
                        data-testid={`food-item-card-${index}`}
                        className={`p-4 rounded-xl border transition-colors ${cat.surfaceClass} ${cat.borderClass}`}
                      >
                        {/* Top Row: Category Swatch + Editable Name + Lookup Button + Remove Button */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                            <span
                              className={`w-3 h-3 rounded-sm shrink-0 ${cat.swatchClass}`}
                              title={`${cat.label} (${cat.typeInspiration})`}
                              aria-hidden="true"
                            />
                            <input
                              type="text"
                              value={item.name}
                              aria-label={`Food item ${index + 1} name`}
                              data-testid={`food-item-name-input-${index}`}
                              onChange={(e) =>
                                onUpdateFoodItem(item.id, {
                                  name: e.target.value,
                                })
                              }
                              onBlur={() =>
                                onLookupItemNutrition(item.id, item.name)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  onLookupItemNutrition(item.id, item.name);
                                }
                              }}
                              className="w-full px-2.5 py-1 text-sm font-semibold text-slate-900 bg-white/95 border border-slate-200 rounded-lg focus:outline-2 focus:outline-slate-900"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                onLookupItemNutrition(item.id, item.name)
                              }
                              title="Re-run nutrition lookup for this food name"
                              data-testid={`lookup-nutrition-button-${index}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white/95 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Search className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Match</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onRemoveFoodItem(item.id)}
                              aria-label={`Remove ${item.name}`}
                              data-testid={`remove-food-item-${index}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:text-rose-950 hover:bg-rose-100/80 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>

                        {/* Middle Row: Editable Category Select & Confirmed Serving Size Input */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-3 items-center">
                          <div className="sm:col-span-7">
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Category ({cat.typeInspiration})
                            </label>
                            <select
                              value={item.category}
                              aria-label={`Category for ${item.name}`}
                              data-testid={`food-item-category-select-${index}`}
                              onChange={(e) =>
                                onUpdateFoodItem(item.id, {
                                  category: e.target.value as FoodCategory,
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-white/95 border border-slate-200 rounded-lg focus:outline-2 focus:outline-slate-900"
                            >
                              {ALL_FOOD_CATEGORIES.map((catKey) => {
                                const meta = FOOD_CATEGORY_TAXONOMY[catKey];
                                return (
                                  <option key={catKey} value={catKey}>
                                    {meta.label} ({meta.typeInspiration})
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className="sm:col-span-5">
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Confirmed Serving Size (g)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateFoodItem(item.id, {
                                    estimatedPortionGrams: Math.max(
                                      0,
                                      sanitizePortionGrams(
                                        item.estimatedPortionGrams - 25
                                      )
                                    ),
                                  })
                                }
                                aria-label={`Decrease portion of ${item.name} by 25g`}
                                data-testid={`decrease-portion-${index}`}
                                className="p-1.5 bg-white/95 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
                              >
                                <Minus className="w-3 h-3" aria-hidden="true" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={5000}
                                step={1}
                                value={item.estimatedPortionGrams}
                                aria-label={`Confirmed serving size in grams for ${item.name}`}
                                data-testid={`food-item-portion-input-${index}`}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  onUpdateFoodItem(item.id, {
                                    estimatedPortionGrams: Number.isFinite(val)
                                      ? sanitizePortionGrams(val)
                                      : 0,
                                  });
                                }}
                                className="w-full px-2 py-1 text-xs font-mono font-semibold text-center text-slate-900 bg-white/95 border border-slate-200 rounded-lg focus:outline-2 focus:outline-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateFoodItem(item.id, {
                                    estimatedPortionGrams: sanitizePortionGrams(
                                      item.estimatedPortionGrams + 25
                                    ),
                                  })
                                }
                                aria-label={`Increase portion of ${item.name} by 25g`}
                                data-testid={`increase-portion-${index}`}
                                className="p-1.5 bg-white/95 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
                              >
                                <Plus className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Item-Level Nutrition Status & Macros Display */}
                        <div className="mt-3 pt-3 border-t border-slate-200/70">
                          {item.nutritionStatus === 'LOADING' && (
                            <div
                              data-testid={`item-nutrition-loading-${index}`}
                              className="flex items-center gap-2 text-xs text-slate-600 py-1"
                            >
                              <Loader2
                                className="w-3.5 h-3.5 animate-spin text-slate-700"
                                aria-hidden="true"
                              />
                              <span>
                                Looking up verified nutrition data (Local Dataset / Open Food Facts)...
                              </span>
                            </div>
                          )}

                          {item.nutritionStatus === 'AMBIGUOUS' && (
                            <div
                              data-testid={`item-nutrition-ambiguous-${index}`}
                              className="p-3 rounded-lg bg-amber-50/90 border border-amber-200 space-y-2"
                            >
                              <div className="flex items-start gap-2 text-xs text-amber-950">
                                <HelpCircle
                                  className="w-4 h-4 text-amber-700 shrink-0 mt-0.5"
                                  aria-hidden="true"
                                />
                                <div>
                                  <p className="font-semibold">
                                    Clarification Required Before Applying Nutrition
                                  </p>
                                  <p className="text-[11px] text-amber-900 mt-0.5">
                                    {item.nutritionMessage}
                                  </p>
                                </div>
                              </div>

                              {item.candidateMatches &&
                                item.candidateMatches.length > 0 && (
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                                    <select
                                      aria-label={`Select intended food preparation for ${item.name}`}
                                      data-testid={`ambiguous-candidate-select-${index}`}
                                      defaultValue=""
                                      onChange={(e) => {
                                        const chosen =
                                          item.candidateMatches?.find(
                                            (c) => c.id === e.target.value
                                          );
                                        if (chosen) {
                                          onSelectCandidateMatch(
                                            item.id,
                                            chosen
                                          );
                                        }
                                      }}
                                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-900"
                                    >
                                      <option value="" disabled>
                                        -- Select exact preparation to calculate nutrition --
                                      </option>
                                      {item.candidateMatches.map((cand) => (
                                        <option key={cand.id} value={cand.id}>
                                          {cand.name} (
                                          {cand.nutritionPer100g.caloriesKcal}{' '}
                                          kcal / 100g)
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                            </div>
                          )}

                          {(item.nutritionStatus === 'UNAVAILABLE' ||
                            item.nutritionStatus === 'ERROR') && (
                            <div
                              data-testid={`item-nutrition-unavailable-${index}`}
                              className="p-2.5 rounded-lg bg-white/80 border border-slate-200 flex items-start justify-between gap-2 text-xs text-slate-700"
                            >
                              <div className="flex items-start gap-2">
                                <AlertCircle
                                  className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                                  aria-hidden="true"
                                />
                                <div>
                                  <span className="font-semibold text-slate-900">
                                    {item.nutritionStatus === 'ERROR'
                                      ? 'Nutrition Lookup Error'
                                      : 'Nutrition Data Unavailable'}
                                  </span>
                                  <p className="text-[11px] text-slate-600 mt-0.5">
                                    {item.nutritionMessage ||
                                      'No verified reference record matched this food name. Edit the name above and click Match to try again.'}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  onLookupItemNutrition(item.id, item.name)
                                }
                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Retry
                              </button>
                            </div>
                          )}

                          {item.nutritionStatus === 'MATCHED' &&
                            item.nutritionPer100g && (
                              <div
                                data-testid={`item-nutrition-matched-${index}`}
                                className="space-y-2"
                              >
                                {/* Scaled Item Macros Strip (for confirmed serving size) */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-white/90 border border-slate-200/90 rounded-lg p-2 text-center">
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">
                                      Calories
                                    </span>
                                    <span
                                      data-testid={`item-calories-${index}`}
                                      className="text-xs font-semibold text-slate-900 font-mono"
                                    >
                                      {formatNutrientValue(
                                        scaledMacros.caloriesKcal,
                                        'kcal'
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">
                                      Protein
                                    </span>
                                    <span
                                      data-testid={`item-protein-${index}`}
                                      className="text-xs font-semibold text-slate-900 font-mono"
                                    >
                                      {formatNutrientValue(
                                        scaledMacros.proteinGrams,
                                        'g'
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">
                                      Carbs
                                    </span>
                                    <span
                                      data-testid={`item-carbs-${index}`}
                                      className="text-xs font-semibold text-slate-900 font-mono"
                                    >
                                      {formatNutrientValue(
                                        scaledMacros.carbsGrams,
                                        'g'
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">
                                      Fat
                                    </span>
                                    <span
                                      data-testid={`item-fat-${index}`}
                                      className="text-xs font-semibold text-slate-900 font-mono"
                                    >
                                      {formatNutrientValue(
                                        scaledMacros.fatGrams,
                                        'g'
                                      )}
                                    </span>
                                  </div>
                                  <div className="col-span-2 sm:col-span-1">
                                    <span className="text-[10px] text-slate-500 block">
                                      Fiber
                                    </span>
                                    <span
                                      data-testid={`item-fiber-${index}`}
                                      className="text-xs font-semibold text-slate-900 font-mono"
                                    >
                                      {formatNutrientValue(
                                        scaledMacros.fiberGrams,
                                        'g'
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {/* Alternate Candidate Switcher if Open Food Facts returned multiple matches */}
                                {item.candidateMatches &&
                                  item.candidateMatches.length > 1 && (
                                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                      <span className="shrink-0 font-medium">
                                        Matched Product:
                                      </span>
                                      <select
                                        value={item.matchedRecordId || ''}
                                        aria-label={`Switch matched nutrition record for ${item.name}`}
                                        onChange={(e) => {
                                          const chosen =
                                            item.candidateMatches?.find(
                                              (c) => c.id === e.target.value
                                            );
                                          if (chosen) {
                                            onSelectCandidateMatch(
                                              item.id,
                                              chosen
                                            );
                                          }
                                        }}
                                        className="w-full px-2 py-1 text-[11px] bg-white/90 border border-slate-200 rounded text-slate-800"
                                      >
                                        {item.candidateMatches.map((cand) => (
                                          <option key={cand.id} value={cand.id}>
                                            {cand.name} (
                                            {cand.nutritionPer100g.caloriesKcal}{' '}
                                            kcal/100g)
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                {/* Source Attribution & Preparation Assumptions */}
                                <div className="text-[11px] text-slate-600 leading-relaxed space-y-0.5">
                                  <div className="flex items-center gap-1.5 text-slate-700">
                                    <Database
                                      className="w-3 h-3 text-slate-500 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <span
                                      data-testid={`item-source-label-${index}`}
                                      className="font-medium"
                                    >
                                      Source: {item.nutritionSourceLabel}
                                    </span>
                                  </div>
                                  {item.preparationAssumptions && (
                                    <p className="text-slate-500">
                                      Assumptions: {item.preparationAssumptions}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Bottom Metadata Line (Unboxed text with typographic separators) */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                          <span className={`font-semibold ${cat.textClass}`}>
                            {cat.label}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">
                            Serving: {item.estimatedPortionGrams} g
                          </span>
                          {confidencePercent && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">
                                {confidencePercent}
                              </span>
                            </>
                          )}
                          {item.isManuallyAdded && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-slate-800">
                                Added manually
                              </span>
                            </>
                          )}
                          {item.userCorrected && !item.isManuallyAdded && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span
                                data-testid={`user-edited-indicator-${index}`}
                                className="font-medium text-slate-800"
                              >
                                Edited by user
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Meal-Level Nutrition Summary Footer */}
      <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Estimated Meal Nutrition Totals
            </span>
            {summary.itemCount > 0 && summary.isComplete && (
              <span
                data-testid="complete-totals-indicator"
                className="inline-flex items-center gap-1 text-emerald-700 font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  All {summary.itemCount} item(s) matched
                </span>
              </span>
            )}
          </div>
          <span data-testid="total-meal-weight" className="font-mono">
            Total Serving Weight: {summary.totalWeightGrams} g
          </span>
        </div>

        {/* Incomplete Totals Warning Banner */}
        {summary.itemCount > 0 && !summary.isComplete && summary.incompleteReason && (
          <div
            role="status"
            data-testid="incomplete-totals-banner"
            className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950"
          >
            <AlertTriangle
              className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <span className="font-semibold">Incomplete Meal Totals: </span>
              <span>{summary.incompleteReason}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 block">Calories</span>
            <span
              data-testid="meal-total-calories"
              className="text-base font-semibold text-slate-900 font-mono mt-0.5 block"
            >
              {summary.totals.caloriesKcal !== null
                ? `${summary.totals.caloriesKcal} kcal`
                : '— kcal'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 block">Protein</span>
            <span
              data-testid="meal-total-protein"
              className="text-base font-semibold text-slate-900 font-mono mt-0.5 block"
            >
              {summary.totals.proteinGrams !== null
                ? `${summary.totals.proteinGrams} g`
                : '— g'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 block">Carbs</span>
            <span
              data-testid="meal-total-carbs"
              className="text-base font-semibold text-slate-900 font-mono mt-0.5 block"
            >
              {summary.totals.carbsGrams !== null
                ? `${summary.totals.carbsGrams} g`
                : '— g'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 block">Total Fat</span>
            <span
              data-testid="meal-total-fat"
              className="text-base font-semibold text-slate-900 font-mono mt-0.5 block"
            >
              {summary.totals.fatGrams !== null
                ? `${summary.totals.fatGrams} g`
                : '— g'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-500 block">Dietary Fiber</span>
            <span
              data-testid="meal-total-fiber"
              className="text-base font-semibold text-slate-900 font-mono mt-0.5 block"
            >
              {summary.totals.fiberGrams !== null
                ? `${summary.totals.fiberGrams} g`
                : '— g'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
