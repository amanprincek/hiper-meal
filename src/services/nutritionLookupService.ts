import { MacroNutrients } from '../types/nutrition';

export interface NutritionLookupQuery {
  foodName: string;
}

export interface NutritionLookupResult {
  status: 'PHASE_1_BOUNDARY_REACHED' | 'FOUND' | 'NOT_FOUND';
  foodName: string;
  nutritionPer100g: MacroNutrients | null;
  sourceLabel: string;
}

/**
 * Service boundary for nutritional profile lookup.
 *
 * Prepared for Phase 3 nutrition lookup integration. Does not fabricate
 * nutritional values or infer nutrition from visual category colors.
 */
export async function lookupNutritionPer100g(
  query: NutritionLookupQuery
): Promise<NutritionLookupResult> {
  const normalized = query.foodName.trim();
  if (!normalized) {
    throw new Error('Food name must not be empty when querying nutrition data.');
  }

  return {
    status: 'PHASE_1_BOUNDARY_REACHED',
    foodName: normalized,
    nutritionPer100g: null,
    sourceLabel: 'Phase 1 Service Boundary (Pending Phase 3 Lookup Integration)',
  };
}
