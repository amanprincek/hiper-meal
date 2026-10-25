export enum FoodCategory {
  PRODUCE = 'produce',
  PROTEIN = 'protein',
  GRAINS = 'grains',
  DAIRY = 'dairy',
  OILS = 'oils',
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
    description: 'Poultry, meat, fish, shellfish, eggs, legumes, tofu, and tempeh.',
    examples: 'Grilled salmon, chicken breast, eggs, lentils, tofu',
    swatchClass: 'bg-rose-600',
    borderClass: 'border-rose-300',
    textClass: 'text-rose-800',
    surfaceClass: 'bg-rose-50/70',
  },
  [FoodCategory.GRAINS]: {
    id: FoodCategory.GRAINS,
    label: 'Grains & Starches',
    typeInspiration: 'Ground-Inspired',
    description: 'Whole and refined cereal grains, breads, pasta, rice, oats, and starchy tubers.',
    examples: 'Brown rice, sourdough bread, quinoa, oats, sweet potato',
    swatchClass: 'bg-amber-700',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-900',
    surfaceClass: 'bg-amber-50/70',
  },
  [FoodCategory.DAIRY]: {
    id: FoodCategory.DAIRY,
    label: 'Dairy & Alternatives',
    typeInspiration: 'Ice-Inspired',
    description: 'Milk, yogurt, kefir, hard and soft cheeses, and fortified dairy alternatives.',
    examples: 'Greek yogurt, cottage cheese, cheddar, milk',
    swatchClass: 'bg-sky-600',
    borderClass: 'border-sky-300',
    textClass: 'text-sky-800',
    surfaceClass: 'bg-sky-50/70',
  },
  [FoodCategory.OILS]: {
    id: FoodCategory.OILS,
    label: 'Oils & Culinary Fats',
    typeInspiration: 'Fire-Inspired',
    description: 'Cooking oils, dressings, butter, ghee, nuts, and concentrated seed fats.',
    examples: 'Extra-virgin olive oil, sesame oil, butter, walnuts',
    swatchClass: 'bg-orange-600',
    borderClass: 'border-orange-300',
    textClass: 'text-orange-800',
    surfaceClass: 'bg-orange-50/70',
  },
};

export interface MacroNutrients {
  caloriesKcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
}

export interface DetectedFoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  estimatedPortionGrams: number;
  confidenceScore?: number;
  userCorrected?: boolean;
  nutritionPer100g?: MacroNutrients;
}

export interface MealNutritionSummary {
  totalWeightGrams: number;
  totals: MacroNutrients;
  itemCount: number;
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
