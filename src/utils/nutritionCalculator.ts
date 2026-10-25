import {
  DetectedFoodItem,
  MacroNutrients,
  MealNutritionSummary,
} from '../types/nutrition';

const MAX_PORTION_GRAMS = 5000;

/**
 * Safely clamps portion weight in grams to a non-negative finite range.
 * Negative, NaN, or infinite inputs are clamped to 0.
 */
export function sanitizePortionGrams(grams: number): number {
  if (!Number.isFinite(grams) || grams < 0) {
    return 0;
  }
  return Math.min(Math.round(grams * 10) / 10, MAX_PORTION_GRAMS);
}

function scaleSingleNutrient(
  valuePer100g: number | null | undefined,
  ratio: number,
  roundToInteger = false
): number | null {
  if (
    valuePer100g === null ||
    valuePer100g === undefined ||
    !Number.isFinite(valuePer100g) ||
    valuePer100g < 0
  ) {
    return null;
  }
  const scaled = valuePer100g * ratio;
  return roundToInteger
    ? Math.round(scaled * 10) / 10
    : Math.round(scaled * 10) / 10;
}

/**
 * Scales per-100g nutrition data to the specified portion weight in grams:
 *   item nutrition = nutrition per 100 grams * confirmed portion grams / 100
 *
 * Important:
 * - A missing nutrient value (null/undefined) stays null and NEVER silently
 *   becomes a verified zero.
 * - If nutritionPer100g is undefined (no nutrition record matched), returns all null.
 */
export function calculateItemNutrition(
  nutritionPer100g: MacroNutrients | undefined,
  portionGrams: number
): MacroNutrients {
  const safeGrams = sanitizePortionGrams(portionGrams);
  if (!nutritionPer100g) {
    return {
      caloriesKcal: null,
      proteinGrams: null,
      carbsGrams: null,
      fatGrams: null,
      fiberGrams: null,
    };
  }

  if (safeGrams === 0) {
    return {
      caloriesKcal:
        nutritionPer100g.caloriesKcal !== null &&
        Number.isFinite(nutritionPer100g.caloriesKcal)
          ? 0
          : null,
      proteinGrams:
        nutritionPer100g.proteinGrams !== null &&
        Number.isFinite(nutritionPer100g.proteinGrams)
          ? 0
          : null,
      carbsGrams:
        nutritionPer100g.carbsGrams !== null &&
        Number.isFinite(nutritionPer100g.carbsGrams)
          ? 0
          : null,
      fatGrams:
        nutritionPer100g.fatGrams !== null &&
        Number.isFinite(nutritionPer100g.fatGrams)
          ? 0
          : null,
      fiberGrams:
        nutritionPer100g.fiberGrams !== null &&
        Number.isFinite(nutritionPer100g.fiberGrams)
          ? 0
          : null,
    };
  }

  const ratio = safeGrams / 100;

  return {
    caloriesKcal: scaleSingleNutrient(
      nutritionPer100g.caloriesKcal,
      ratio,
      true
    ),
    proteinGrams: scaleSingleNutrient(nutritionPer100g.proteinGrams, ratio),
    carbsGrams: scaleSingleNutrient(nutritionPer100g.carbsGrams, ratio),
    fatGrams: scaleSingleNutrient(nutritionPer100g.fatGrams, ratio),
    fiberGrams: scaleSingleNutrient(nutritionPer100g.fiberGrams, ratio),
  };
}

function addNullableMacro(
  accumulated: number | null,
  addition: number | null
): number | null {
  if (addition === null || !Number.isFinite(addition)) {
    return accumulated;
  }
  const current = accumulated ?? 0;
  return Math.round((current + addition) * 10) / 10;
}

/**
 * Aggregates meal-level totals across all logged food items.
 * Clearly flags when totals are incomplete because one or more items lack
 * nutrition records or are missing specific nutrient fields.
 */
export function aggregateMealNutrition(
  items: DetectedFoodItem[]
): MealNutritionSummary {
  let totalWeightGrams = 0;
  let itemsWithNutritionCount = 0;
  let itemsMissingNutritionCount = 0;
  let hasMissingFiberInMatchedItems = false;

  let totals: MacroNutrients = {
    caloriesKcal: null,
    proteinGrams: null,
    carbsGrams: null,
    fatGrams: null,
    fiberGrams: null,
  };

  for (const item of items) {
    const safeGrams = sanitizePortionGrams(item.estimatedPortionGrams);
    totalWeightGrams = Math.round((totalWeightGrams + safeGrams) * 10) / 10;

    const hasMatchedRecord = Boolean(
      item.nutritionPer100g &&
        item.nutritionPer100g.caloriesKcal !== null &&
        item.nutritionPer100g.proteinGrams !== null &&
        item.nutritionPer100g.carbsGrams !== null &&
        item.nutritionPer100g.fatGrams !== null
    );

    if (!hasMatchedRecord) {
      itemsMissingNutritionCount += 1;
      continue;
    }

    itemsWithNutritionCount += 1;
    if (item.nutritionPer100g?.fiberGrams === null) {
      hasMissingFiberInMatchedItems = true;
    }

    const scaled = calculateItemNutrition(item.nutritionPer100g, safeGrams);
    totals = {
      caloriesKcal: addNullableMacro(totals.caloriesKcal, scaled.caloriesKcal),
      proteinGrams: addNullableMacro(totals.proteinGrams, scaled.proteinGrams),
      carbsGrams: addNullableMacro(totals.carbsGrams, scaled.carbsGrams),
      fatGrams: addNullableMacro(totals.fatGrams, scaled.fatGrams),
      fiberGrams: addNullableMacro(totals.fiberGrams, scaled.fiberGrams),
    };
  }

  const isComplete =
    items.length > 0 &&
    itemsMissingNutritionCount === 0 &&
    !hasMissingFiberInMatchedItems;

  let incompleteReason: string | null = null;
  if (items.length > 0 && itemsMissingNutritionCount > 0) {
    incompleteReason = `${itemsMissingNutritionCount} of ${items.length} item(s) lack verified nutrition data. Totals reflect only matched items (${itemsWithNutritionCount}/${items.length}).`;
  } else if (items.length > 0 && hasMissingFiberInMatchedItems) {
    incompleteReason =
      'One or more matched packaged records do not report dietary fiber per 100g. Fiber total is partial.';
  }

  return {
    totalWeightGrams,
    totals,
    itemCount: items.length,
    itemsWithNutritionCount,
    itemsMissingNutritionCount,
    hasMissingFiberInMatchedItems,
    isComplete,
    incompleteReason,
  };
}
