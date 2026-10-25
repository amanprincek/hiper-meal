export enum FoodCategory {
  PRODUCE = 'produce',
  PROTEIN = 'protein',
  GRAINS = 'grains',
  DAIRY = 'dairy',
  OILS = 'oils',
}

export const ALL_FOOD_CATEGORIES: FoodCategory[] = [
  FoodCategory.PRODUCE,
  FoodCategory.PROTEIN,
  FoodCategory.GRAINS,
  FoodCategory.DAIRY,
  FoodCategory.OILS,
];

export function isValidFoodCategory(value: unknown): value is FoodCategory {
  return (
    typeof value === 'string' &&
    ALL_FOOD_CATEGORIES.includes(value as FoodCategory)
  );
}

export interface FoodCategoryTaxonomy {
  id: FoodCategory;
  label: string;
  typeInspiration: string;
  description: string;
  examples: string;
  swatchClass: string;
  borderClass: string;
  textClass: string;
  surfaceClass: string;
}

/**
 * Pokémon-type-inspired visual categorization system.
 * Note: Colors are strictly for visual categorization only.
 * Nutritional properties are never inferred from visual categories.
 */
export const FOOD_CATEGORY_TAXONOMY: Record<FoodCategory, FoodCategoryTaxonomy> = {
  [FoodCategory.PRODUCE]: {
    id: FoodCategory.PRODUCE,
    label: 'Fruits & Vegetables',
    typeInspiration: 'Grass-Inspired',
    description: 'Fresh leafy greens, root vegetables, cruciferous produce, and whole fruits.',
    examples: 'Spinach, broccoli, berries, avocado, tomatoes',
    swatchClass: 'bg-emerald-600',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-800',
    surfaceClass: 'bg-emerald-50/70',
  },
  [FoodCategory.PROTEIN]: {
    id: FoodCategory.PROTEIN,
    label: 'Protein-Rich Foods',
    typeInspiration: 'Fighting-Inspired',
    description: 'Poultry, meat, fish, shellfish, eggs, legumes, lentils, paneer, tofu, and tempeh.',
    examples: 'Dal tadka, grilled salmon, chicken breast, eggs, paneer, tofu',
    swatchClass: 'bg-rose-600',
    borderClass: 'border-rose-300',
    textClass: 'text-rose-800',
    surfaceClass: 'bg-rose-50/70',
  },
  [FoodCategory.GRAINS]: {
    id: FoodCategory.GRAINS,
    label: 'Grains & Starches',
    typeInspiration: 'Ground-Inspired',
    description: 'Whole and refined cereal grains, rotis, flatbreads, pasta, rice, oats, and starchy tubers.',
    examples: 'Basmati rice, whole-wheat roti, sourdough bread, quinoa, oats',
    swatchClass: 'bg-amber-700',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-900',
    surfaceClass: 'bg-amber-50/70',
  },
  [FoodCategory.DAIRY]: {
    id: FoodCategory.DAIRY,
    label: 'Dairy & Alternatives',
    typeInspiration: 'Ice-Inspired',
    description: 'Milk, curd, raita, yogurt, kefir, cheeses, and fortified dairy alternatives.',
    examples: 'Plain curd, boondi raita, Greek yogurt, cheddar, milk',
    swatchClass: 'bg-sky-600',
    borderClass: 'border-sky-300',
    textClass: 'text-sky-800',
    surfaceClass: 'bg-sky-50/70',
  },
  [FoodCategory.OILS]: {
    id: FoodCategory.OILS,
    label: 'Oils & Culinary Fats',
    typeInspiration: 'Fire-Inspired',
    description: 'Cooking oils, ghee, butter, dressings, fried snacks, nuts, and concentrated seed fats.',
    examples: 'Ghee tadka, olive oil, butter, walnuts, fried crisps',
    swatchClass: 'bg-orange-600',
    borderClass: 'border-orange-300',
    textClass: 'text-orange-800',
    surfaceClass: 'bg-orange-50/70',
  },
};

/**
 * Macronutrients per 100g or scaled to a portion.
 * A null value indicates that a specific nutrient (such as dietary fiber in some
 * packaged food records) is unrecorded in the source data and must not be
 * silently treated as a verified zero.
 */
export interface MacroNutrients {
  caloriesKcal: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
}

export type NutritionSourceType = 'LOCAL_INDIAN_DATASET' | 'OPEN_FOOD_FACTS';

export type ItemNutritionStatus =
  | 'IDLE'
  | 'LOADING'
  | 'MATCHED'
  | 'AMBIGUOUS'
  | 'UNAVAILABLE'
  | 'ERROR';

export interface NutritionCandidateMatch {
  id: string;
  name: string;
  description: string;
  sourceType: NutritionSourceType;
  sourceReference: string;
  preparationAssumptions?: string;
  nutritionPer100g: MacroNutrients;
  barcode?: string;
  brand?: string;
}

export interface DetectedFoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  estimatedPortionGrams: number;
  confidenceScore?: number;
  identificationNote?: string;
  userCorrected?: boolean;
  isManuallyAdded?: boolean;
  nutritionPer100g?: MacroNutrients;
  nutritionStatus?: ItemNutritionStatus;
  nutritionSourceType?: NutritionSourceType;
  nutritionSourceLabel?: string;
  matchedRecordId?: string;
  matchedFoodDescription?: string;
  preparationAssumptions?: string;
  nutritionMessage?: string;
  candidateMatches?: NutritionCandidateMatch[];
}

export interface MealNutritionSummary {
  totalWeightGrams: number;
  totals: MacroNutrients;
  itemCount: number;
  itemsWithNutritionCount: number;
  itemsMissingNutritionCount: number;
  hasMissingFiberInMatchedItems: boolean;
  isComplete: boolean;
  incompleteReason: string | null;
}

export interface UploadedMealImage {
  file: File;
  previewUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  uploadedAtIso: string;
}

export type ImageValidationErrorCode =
  | 'NO_FILE_SELECTED'
  | 'EMPTY_FILE'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'CORRUPTED_IMAGE';

export interface ImageValidationError {
  code: ImageValidationErrorCode;
  title: string;
  message: string;
}

export type AnalysisStatus =
  | 'IDLE'
  | 'READY_TO_ANALYZE'
  | 'ANALYZING'
  | 'PHASE_1_BOUNDARY'
  | 'COMPLETED'
  | 'ERROR';
