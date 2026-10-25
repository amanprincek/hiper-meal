import {
  DetectedFoodItem,
  MacroNutrients,
  MealNutritionSummary,
} from '../types/nutrition';

const MAX_PORTION_GRAMS = 5000;

/**
 * Safely clamps portion weight in grams to a non-negative finite range.
 */
export function sanitizePortionGrams(grams: number): number {
  if (!Number.isFinite(grams) || grams < 0) {
    return 0;
  }
  return Math.min(Math.round(grams * 10) / 10, MAX_PORTION_GRAMS);
}

/**
 * Scales per-100g nutrition data to the specified portion weight in grams.
 * Does not infer nutritional properties from visual food categories.
 */
export function calculateItemNutrition(
  nutritionPer100g: MacroNutrients | undefined,
  portionGrams: number
): MacroNutrients {
  const safeGrams = sanitizePortionGrams(portionGrams);
  if (!nutritionPer100g || safeGrams === 0) {
    return {
      caloriesKcal: 0,
      proteinGrams: 0,
      carbsGrams: 0,
      fatGrams: 0,
      fiberGrams: 0,
    };
  }

  const ratio = safeGrams / 100;
  return {
    caloriesKcal: Math.round(nutritionPer100g.caloriesKcal * ratio),
    proteinGrams: Math.round(nutritionPer100g.proteinGrams * ratio * 10) / 10,
    carbsGrams: Math.round(nutritionPer100g.carbsGrams * ratio * 10) / 10,
    fatGrams: Math.round(nutritionPer100g.fatGrams * ratio * 10) / 10,
    fiberGrams: Math.round(nutritionPer100g.fiberGrams * ratio * 10) / 10,
  };
}

/**
 * Aggregates total meal nutrition across all verified food items.
 */
export function aggregateMealNutrition(
  items: DetectedFoodItem[]
): MealNutritionSummary {
  return items.reduce<MealNutritionSummary>(
    (acc, item) => {
      const safeGrams = sanitizePortionGrams(item.estimatedPortionGrams);
      const itemMacros = calculateItemNutrition(
        item.nutritionPer100g,
        safeGrams
      );

      return {
        totalWeightGrams: Math.round((acc.totalWeightGrams + safeGrams) * 10) / 10,
        itemCount: acc.itemCount + 1,
        totals: {
          caloriesKcal: acc.totals.caloriesKcal + itemMacros.caloriesKcal,
          proteinGrams:
            Math.round((acc.totals.proteinGrams + itemMacros.proteinGrams) * 10) /
            10,
          carbsGrams:
            Math.round((acc.totals.carbsGrams + itemMacros.carbsGrams) * 10) /
            10,
          fatGrams:
            Math.round((acc.totals.fatGrams + itemMacros.fatGrams) * 10) / 10,
          fiberGrams:
            Math.round((acc.totals.fiberGrams + itemMacros.fiberGrams) * 10) /
            10,
        },
      };
    },
    {
      totalWeightGrams: 0,
      itemCount: 0,
      totals: {
        caloriesKcal: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fiberGrams: 0,
      },
    }
  );
}
