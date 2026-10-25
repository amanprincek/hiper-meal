import {
  entryToCandidateMatch,
  isLikelyPackagedFoodQuery,
  normalizeFoodQuery,
  searchLocalIndianDataset,
} from '../data/indianFoodDataset';
import {
  DetectedFoodItem,
  ItemNutritionStatus,
  MacroNutrients,
  NutritionCandidateMatch,
  NutritionSourceType,
} from '../types/nutrition';
import { validateOpenFoodFactsProduct } from './openFoodFactsValidator';

export interface NutritionLookupQuery {
  foodName: string;
  forceSource?: 'AUTO' | 'OPEN_FOOD_FACTS' | 'LOCAL_ONLY';
  endpointUrl?: string;
  timeoutMs?: number;
  customHeaders?: Record<string, string>;
}

export interface NutritionLookupResult {
  status: ItemNutritionStatus;
  foodName: string;
  nutritionPer100g: MacroNutrients | null;
  sourceType?: NutritionSourceType;
  sourceLabel: string;
  matchedRecordId?: string;
  matchedFoodDescription?: string;
  preparationAssumptions?: string;
  message: string;
  candidates: NutritionCandidateMatch[];
}

/**
 * Queries Open Food Facts via the server-side proxy (/api/nutrition/openfoodfacts)
 * and filters all returned products through strict relevance, per-100g, and unit validation.
 */
export async function searchOpenFoodFactsCatalog(
  foodName: string,
  options?: {
    endpointUrl?: string;
    timeoutMs?: number;
    customHeaders?: Record<string, string>;
  }
): Promise<{
  status: 'MATCHED' | 'UNAVAILABLE' | 'ERROR';
  candidates: NutritionCandidateMatch[];
  errorMessage?: string;
}> {
  const cleanedQuery = normalizeFoodQuery(foodName) || foodName.trim();
  if (!cleanedQuery) {
    return { status: 'UNAVAILABLE', candidates: [] };
  }

  const baseEndpoint = options?.endpointUrl ?? '/api/nutrition/openfoodfacts';
  const timeoutMs = options?.timeoutMs ?? 9000;
  const url = `${baseEndpoint}?q=${encodeURIComponent(cleanedQuery)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(options?.customHeaders ?? {}),
      },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const isAbort =
      (err instanceof DOMException && err.name === 'AbortError') ||
      (err instanceof Error && err.name === 'AbortError');
    return {
      status: 'ERROR',
      candidates: [],
      errorMessage: isAbort
        ? 'Open Food Facts lookup timed out. Please retry or select a local reference.'
        : 'Network error while contacting Open Food Facts lookup endpoint.',
    };
  } finally {
    clearTimeout(timer);
  }

  let body: Record<string, unknown>;
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    return {
      status: 'ERROR',
      candidates: [],
      errorMessage: `Open Food Facts proxy returned malformed JSON (HTTP ${response.status}).`,
    };
  }

  if (!response.ok) {
    const errObj =
      body && typeof body.error === 'object'
        ? (body.error as Record<string, unknown>)
        : null;
    const msg =
      errObj && typeof errObj.message === 'string'
        ? errObj.message
        : `Open Food Facts lookup failed (HTTP ${response.status}).`;
    return {
      status: 'ERROR',
      candidates: [],
      errorMessage: msg,
    };
  }

  const rawProducts = Array.isArray(body.products) ? body.products : [];
  const scoredCandidates: Array<{
    score: number;
    candidate: NutritionCandidateMatch;
  }> = [];

  for (const rawProd of rawProducts) {
    const validation = validateOpenFoodFactsProduct(rawProd, cleanedQuery);
    if (validation.isValid && validation.candidate) {
      scoredCandidates.push({
        score: validation.relevanceScore,
        candidate: validation.candidate,
      });
    }
  }

  scoredCandidates.sort((a, b) => b.score - a.score);

  const uniqueCandidates: NutritionCandidateMatch[] = [];
  const seenIds = new Set<string>();
  for (const item of scoredCandidates) {
    if (!seenIds.has(item.candidate.id)) {
      seenIds.add(item.candidate.id);
      uniqueCandidates.push(item.candidate);
    }
    if (uniqueCandidates.length >= 5) break;
  }

  if (uniqueCandidates.length === 0) {
    return { status: 'UNAVAILABLE', candidates: [] };
  }

  return {
    status: 'MATCHED',
    candidates: uniqueCandidates,
  };
}

/**
 * Executes the Phase 3 Lookup Strategy:
 * 1. Search the local dataset for an appropriate match to a recognized common Indian food
 *    (unless the query is a packaged food product, which requires product-specific lookup).
 * 2. For packaged foods (or when not found in the local dataset), search Open Food Facts
 *    and strictly validate candidate products.
 * 3. For ambiguous food names, return status: 'AMBIGUOUS' with candidate options so the
 *    user can clarify the intended food before applying a nutrition record.
 * 4. If no reliable match exists, report status: 'UNAVAILABLE'.
 */
export async function lookupNutritionPer100g(
  query: NutritionLookupQuery
): Promise<NutritionLookupResult> {
  const trimmedName = query.foodName.trim();
  if (!trimmedName) {
    throw new Error('Food name must not be empty when querying nutrition data.');
  }

  const forceSource = query.forceSource ?? 'AUTO';
  const packaged = isLikelyPackagedFoodQuery(trimmedName);

  // Step 1: Search local Indian-food dataset first (unless packaged product or forced OFF)
  if (forceSource !== 'OPEN_FOOD_FACTS' && !packaged) {
    const localResult = searchLocalIndianDataset(trimmedName);

    if (localResult.status === 'MATCHED' && localResult.matchedEntry) {
      const entry = localResult.matchedEntry;
      return {
        status: 'MATCHED',
        foodName: trimmedName,
        nutritionPer100g: entry.nutritionPer100g,
        sourceType: 'LOCAL_INDIAN_DATASET',
        sourceLabel: `Local Indian Dataset · ${entry.sourceReference}`,
        matchedRecordId: entry.id,
        matchedFoodDescription: entry.description,
        preparationAssumptions: entry.preparationAssumptions,
        message: `Matched local reference: ${entry.name}`,
        candidates: [entryToCandidateMatch(entry)],
      };
    }

    if (localResult.status === 'AMBIGUOUS') {
      return {
        status: 'AMBIGUOUS',
        foodName: trimmedName,
        nutritionPer100g: null,
        sourceLabel: 'Clarification Required (Multiple Preparations)',
        message: `"${trimmedName}" matches multiple preparations with different nutritional profiles. Please select the intended preparation below.`,
        candidates: localResult.candidates,
      };
    }

    if (forceSource === 'LOCAL_ONLY') {
      return {
        status: 'UNAVAILABLE',
        foodName: trimmedName,
        nutritionPer100g: null,
        sourceLabel: 'Nutrition Data Unavailable',
        message: `No matching record found in the local Indian dataset for "${trimmedName}".`,
        candidates: [],
      };
    }
  }

  // Step 2: Search Open Food Facts for packaged foods or items not in the local dataset
  const offResult = await searchOpenFoodFactsCatalog(trimmedName, {
    endpointUrl: query.endpointUrl,
    timeoutMs: query.timeoutMs,
    customHeaders: query.customHeaders,
  });

  if (offResult.status === 'ERROR') {
    return {
      status: 'ERROR',
      foodName: trimmedName,
      nutritionPer100g: null,
      sourceLabel: 'Open Food Facts Lookup Error',
      message:
        offResult.errorMessage ||
        'Failed to query Open Food Facts for this food item.',
      candidates: [],
    };
  }

  if (offResult.status === 'MATCHED' && offResult.candidates.length > 0) {
    const topMatch = offResult.candidates[0];
    return {
      status: 'MATCHED',
      foodName: trimmedName,
      nutritionPer100g: topMatch.nutritionPer100g,
      sourceType: 'OPEN_FOOD_FACTS',
      sourceLabel: topMatch.sourceReference,
      matchedRecordId: topMatch.id,
      matchedFoodDescription: topMatch.description,
      preparationAssumptions: topMatch.preparationAssumptions,
      message: `Matched Open Food Facts record: ${topMatch.name}`,
      candidates: offResult.candidates,
    };
  }

  // Step 3: No reliable match in either source
  return {
    status: 'UNAVAILABLE',
    foodName: trimmedName,
    nutritionPer100g: null,
    sourceLabel: 'Nutrition Data Unavailable',
    message: `No verified nutrition record found for "${trimmedName}" in the local Indian food dataset or Open Food Facts.`,
    candidates: [],
  };
}

/**
 * Helper to apply a NutritionLookupResult onto a DetectedFoodItem.
 */
export function applyLookupResultToFoodItem(
  item: DetectedFoodItem,
  result: NutritionLookupResult
): DetectedFoodItem {
  return {
    ...item,
    nutritionStatus: result.status,
    nutritionPer100g: result.nutritionPer100g ?? undefined,
    nutritionSourceType: result.sourceType,
    nutritionSourceLabel: result.sourceLabel,
    matchedRecordId: result.matchedRecordId,
    matchedFoodDescription: result.matchedFoodDescription,
    preparationAssumptions: result.preparationAssumptions,
    nutritionMessage: result.message,
    candidateMatches: result.candidates,
  };
}

/**
 * Helper to apply a user-selected candidate match (e.g., resolving an ambiguous food
 * or switching to an alternate Open Food Facts product) onto a DetectedFoodItem.
 */
export function applyCandidateMatchToFoodItem(
  item: DetectedFoodItem,
  candidate: NutritionCandidateMatch
): DetectedFoodItem {
  return {
    ...item,
    nutritionStatus: 'MATCHED',
    nutritionPer100g: candidate.nutritionPer100g,
    nutritionSourceType: candidate.sourceType,
    nutritionSourceLabel:
      candidate.sourceType === 'LOCAL_INDIAN_DATASET'
        ? `Local Indian Dataset · ${candidate.sourceReference}`
        : candidate.sourceReference,
    matchedRecordId: candidate.id,
    matchedFoodDescription: candidate.description,
    preparationAssumptions: candidate.preparationAssumptions,
    nutritionMessage: `Selected reference: ${candidate.name}`,
  };
}
