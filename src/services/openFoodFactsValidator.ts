import {
  MacroNutrients,
  NutritionCandidateMatch,
} from '../types/nutrition';

export interface OpenFoodFactsRawProduct {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string | string[];
  nutrition_data_per?: string;
  nutriments?: Record<string, unknown>;
}

export type ProductValidationFailureReason =
  | 'MALFORMED_PRODUCT'
  | 'UNRELATED_PRODUCT_NAME'
  | 'NOT_PER_100G'
  | 'MISSING_NUTRITION_VALUES'
  | 'INVALID_NUTRIENT_UNITS';

export interface OpenFoodFactsValidationResult {
  isValid: boolean;
  reason?: ProductValidationFailureReason;
  message?: string;
  relevanceScore: number;
  candidate?: NutritionCandidateMatch;
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'with',
  'for',
  'from',
  'pack',
  'packet',
  'bag',
  'box',
  'cup',
  'net',
  'wt',
  'plain',
  'classic',
  'fresh',
  'natural',
  'style',
  'home',
  'cooked',
]);

export function extractSignificantTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[~0-9]+g\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

/**
 * Computes token relevance between the user's searched food name and the
 * candidate Open Food Facts product name + brand.
 * Prevents selecting an unrelated product merely because of a single shared character or weak substring.
 */
export function calculateProductRelevance(
  query: string,
  productName: string,
  brand = ''
): number {
  const queryTokens = extractSignificantTokens(query);
  const targetTokens = extractSignificantTokens(`${productName} ${brand}`);

  if (queryTokens.length === 0 || targetTokens.length === 0) {
    return 0;
  }

  let matchedQueryTokens = 0;
  for (const qToken of queryTokens) {
    const qStem = qToken.endsWith('s') ? qToken.slice(0, -1) : qToken;
    const hasMatch = targetTokens.some((tToken) => {
      const tStem = tToken.endsWith('s') ? tToken.slice(0, -1) : tToken;
      return tStem === qStem || tToken === qToken;
    });
    if (hasMatch) {
      matchedQueryTokens += 1;
    }
  }

  // Require primary head noun match or >= 60% token overlap
  const lastQueryToken = queryTokens[queryTokens.length - 1];
  const lastStem = lastQueryToken.endsWith('s')
    ? lastQueryToken.slice(0, -1)
    : lastQueryToken;
  const matchesHeadNoun = targetTokens.some((tToken) => {
    const tStem = tToken.endsWith('s') ? tToken.slice(0, -1) : tToken;
    return tStem === lastStem;
  });

  const ratio = matchedQueryTokens / queryTokens.length;
  if (!matchesHeadNoun && ratio < 0.75) {
    return ratio * 0.4;
  }

  return ratio;
}

function isValidGramUnit(unit: unknown): boolean {
  if (unit === undefined || unit === null || unit === '') {
    return true;
  }
  if (typeof unit !== 'string') {
    return false;
  }
  const norm = unit.trim().toLowerCase();
  return norm === 'g' || norm === 'gram' || norm === 'grams';
}

function isValidKcalUnit(unit: unknown): boolean {
  if (unit === undefined || unit === null || unit === '') {
    return true;
  }
  if (typeof unit !== 'string') {
    return false;
  }
  const norm = unit.trim().toLowerCase();
  return norm === 'kcal' || norm === 'kj';
}

function parseNonNegativeNumber(
  value: unknown,
  maxBound: number
): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > maxBound) {
    return null;
  }
  return Math.round(num * 10) / 10;
}

/**
 * Validates a raw Open Food Facts product record before its nutritional values
 * can be used. Checks:
 * 1. Well-formed object & product name
 * 2. Product name relevance against the query
 * 3. Per-100g nutrition basis
 * 4. Valid units (kcal, g)
 * 5. Complete core macronutrients (calories, protein, carbs, fat), while preserving
 *    null for unrecorded fiber rather than turning missing fiber into a fake 0.
 */
export function validateOpenFoodFactsProduct(
  rawProduct: unknown,
  searchQuery: string
): OpenFoodFactsValidationResult {
  if (!rawProduct || typeof rawProduct !== 'object' || Array.isArray(rawProduct)) {
    return {
      isValid: false,
      reason: 'MALFORMED_PRODUCT',
      message: 'Product record is not a valid object.',
      relevanceScore: 0,
    };
  }

  const product = rawProduct as OpenFoodFactsRawProduct;
  const productName = (
    product.product_name_en ||
    product.product_name ||
    ''
  ).trim();

  if (!productName) {
    return {
      isValid: false,
      reason: 'MALFORMED_PRODUCT',
      message: 'Product record is missing a product name.',
      relevanceScore: 0,
    };
  }

  const brandStr = Array.isArray(product.brands)
    ? product.brands.join(', ').trim()
    : typeof product.brands === 'string'
      ? product.brands.trim()
      : '';

  const relevanceScore = calculateProductRelevance(
    searchQuery,
    productName,
    brandStr
  );

  if (relevanceScore < 0.5) {
    return {
      isValid: false,
      reason: 'UNRELATED_PRODUCT_NAME',
      message: `Product "${productName}" does not sufficiently match query "${searchQuery}" (relevance ${Math.round(relevanceScore * 100)}%).`,
      relevanceScore,
    };
  }

  // Check whether values are expressed per 100g
  if (
    typeof product.nutrition_data_per === 'string' &&
    product.nutrition_data_per.trim() !== ''
  ) {
    const perBasis = product.nutrition_data_per.trim().toLowerCase();
    if (perBasis !== '100g' && perBasis !== '100ml') {
      return {
        isValid: false,
        reason: 'NOT_PER_100G',
        message: `Product "${productName}" reports nutrition per "${product.nutrition_data_per}" instead of per 100g.`,
        relevanceScore,
      };
    }
  }

  const nutriments = product.nutriments;
  if (!nutriments || typeof nutriments !== 'object') {
    return {
      isValid: false,
      reason: 'MISSING_NUTRITION_VALUES',
      message: `Product "${productName}" has no nutriments object.`,
      relevanceScore,
    };
  }

  // Validate units when explicitly present
  if (
    !isValidKcalUnit(nutriments['energy-kcal_unit']) ||
    !isValidGramUnit(nutriments['proteins_unit']) ||
    !isValidGramUnit(nutriments['carbohydrates_unit']) ||
    !isValidGramUnit(nutriments['fat_unit']) ||
    !isValidGramUnit(nutriments['fiber_unit'])
  ) {
    return {
      isValid: false,
      reason: 'INVALID_NUTRIENT_UNITS',
      message: `Product "${productName}" has unsupported or inconsistent nutrient units.`,
      relevanceScore,
    };
  }

  // Extract per-100g calories (prefer energy-kcal_100g, fallback to energy-kj_100g / 4.184)
  let caloriesKcal = parseNonNegativeNumber(
    nutriments['energy-kcal_100g'],
    950
  );
  if (caloriesKcal === null && nutriments['energy-kj_100g'] !== undefined) {
    const kj = parseNonNegativeNumber(nutriments['energy-kj_100g'], 4000);
    if (kj !== null) {
      caloriesKcal = Math.round((kj / 4.184) * 10) / 10;
    }
  }

  const proteinGrams = parseNonNegativeNumber(nutriments['proteins_100g'], 100);
  const carbsGrams = parseNonNegativeNumber(
    nutriments['carbohydrates_100g'],
    100
  );
  const fatGrams = parseNonNegativeNumber(nutriments['fat_100g'], 100);

  // Core macros (calories, protein, carbs, fat per 100g) must all be present
  if (
    caloriesKcal === null ||
    proteinGrams === null ||
    carbsGrams === null ||
    fatGrams === null
  ) {
    return {
      isValid: false,
      reason: 'MISSING_NUTRITION_VALUES',
      message: `Product "${productName}" is missing complete per-100g calorie or macronutrient values.`,
      relevanceScore,
    };
  }

  // Fiber per 100g is optional in Open Food Facts; if missing, keep as null (never fake 0)
  const fiberGrams = parseNonNegativeNumber(nutriments['fiber_100g'], 100);

  const code =
    typeof product.code === 'string' && product.code.trim()
      ? product.code.trim()
      : 'unlisted';

  const displayTitle = brandStr
    ? `${productName} (${brandStr})`
    : productName;

  const nutritionPer100g: MacroNutrients = {
    caloriesKcal,
    proteinGrams,
    carbsGrams,
    fatGrams,
    fiberGrams,
  };

  return {
    isValid: true,
    relevanceScore,
    candidate: {
      id: `off-${code}`,
      name: displayTitle,
      description: `Open Food Facts packaged food record${brandStr ? ` · Brand: ${brandStr}` : ''} · Barcode: ${code}`,
      sourceType: 'OPEN_FOOD_FACTS',
      sourceReference: `Open Food Facts (https://world.openfoodfacts.org/product/${code})`,
      preparationAssumptions:
        fiberGrams === null
          ? 'Per 100g packaged product values from Open Food Facts. Dietary fiber was not reported on this product record (shown as N/A).'
          : 'Per 100g packaged product values from Open Food Facts.',
      nutritionPer100g,
      barcode: code,
      brand: brandStr || undefined,
    },
  };
}
