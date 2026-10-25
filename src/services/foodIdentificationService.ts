import {
  DetectedFoodItem,
  FoodCategory,
  UploadedMealImage,
  isValidFoodCategory,
} from '../types/nutrition';
import {
  MAX_IMAGE_SIZE_BYTES,
  validateMealImageFile,
} from '../utils/imageValidation';
import { sanitizePortionGrams } from '../utils/nutritionCalculator';

export interface FoodIdentificationRequest {
  image: UploadedMealImage;
  timeoutMs?: number;
  endpointUrl?: string;
}

export interface FoodIdentificationResponse {
  status: 'SUCCESS';
  modelUsed: string;
  isFoodImage: boolean;
  items: DetectedFoodItem[];
  message: string;
  timestampIso: string;
}

/**
 * Validates the raw JSON payload returned from POST /api/analyze-meal
 * before passing results to the React state and UI.
 */
export function validateAnalysisApiResponse(
  payload: unknown
): FoodIdentificationResponse {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(
      'Received an invalid response structure from the meal analysis server.'
    );
  }

  const record = payload as Record<string, unknown>;

  if (record.error && typeof record.error === 'object') {
    const errObj = record.error as Record<string, unknown>;
    const errMessage =
      typeof errObj.message === 'string' && errObj.message.trim()
        ? errObj.message.trim()
        : 'Server failed to analyze the meal image.';
    throw new Error(errMessage);
  }

  if (record.status !== 'SUCCESS') {
    throw new Error(
      'Unexpected analysis status received from server response.'
    );
  }

  if (typeof record.isFoodImage !== 'boolean') {
    throw new Error(
      'Server response is missing the required "isFoodImage" boolean flag.'
    );
  }

  if (typeof record.overallNote !== 'string' || !record.overallNote.trim()) {
    throw new Error(
      'Server response is missing the required "overallNote" summary.'
    );
  }

  if (!Array.isArray(record.items)) {
    throw new Error(
      'Server response is missing a valid "items" array of food detections.'
    );
  }

  const validatedItems: DetectedFoodItem[] = record.items.map((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      throw new Error(
        `Invalid food detection object at index ${index} in server response.`
      );
    }

    const item = raw as Record<string, unknown>;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name) {
      throw new Error(
        `Detected food item at index ${index} is missing a valid name.`
      );
    }

    const category: FoodCategory = isValidFoodCategory(item.category)
      ? item.category
      : FoodCategory.PRODUCE;

    const rawPortion = Number(item.estimatedPortionGrams);
    if (!Number.isFinite(rawPortion) || rawPortion <= 0) {
      throw new Error(
        `Detected food item "${name}" has an invalid portion weight.`
      );
    }

    let confidenceScore: number | undefined = undefined;
    if (item.confidenceScore !== undefined && item.confidenceScore !== null) {
      const conf = Number(item.confidenceScore);
      if (Number.isFinite(conf)) {
        confidenceScore = Math.max(0, Math.min(1, conf));
      }
    }

    const identificationNote =
      typeof item.identificationNote === 'string' &&
      item.identificationNote.trim()
        ? item.identificationNote.trim()
        : undefined;

    return {
      id:
        typeof item.id === 'string' && item.id.trim()
          ? item.id.trim()
          : `detected-${Date.now()}-${index}`,
      name,
      category,
      estimatedPortionGrams: sanitizePortionGrams(rawPortion),
      confidenceScore,
      identificationNote,
      userCorrected: Boolean(item.userCorrected),
      isManuallyAdded: Boolean(item.isManuallyAdded),
    };
  });

  const modelUsed =
    typeof record.modelUsed === 'string' && record.modelUsed.trim()
      ? record.modelUsed.trim()
      : 'gemma-4-26b-a4b-it';

  const timestampIso =
    typeof record.timestampIso === 'string' && record.timestampIso.trim()
      ? record.timestampIso.trim()
      : new Date().toISOString();

  return {
    status: 'SUCCESS',
    modelUsed,
    isFoodImage: record.isFoodImage,
    items: validatedItems,
    message: record.overallNote.trim(),
    timestampIso,
  };
}

/**
 * Calls the server-side POST /api/analyze-meal vision endpoint.
 * Preserves Phase 1 client-side validation and handles timeouts, network
 * failures, malformed JSON, and HTTP server errors cleanly.
 */
export async function identifyFoodItemsInMeal(
  request: FoodIdentificationRequest
): Promise<FoodIdentificationResponse> {
  if (!request?.image?.previewUrl || request.image.sizeBytes <= 0) {
    throw new Error('A valid meal image is required before running analysis.');
  }

  if (request.image.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Selected meal image exceeds the 10.00 MB maximum limit.');
  }

  if (request.image.file) {
    const fileValidationError = validateMealImageFile(request.image.file);
    if (fileValidationError) {
      throw new Error(fileValidationError.message);
    }
  }

  const timeoutMs = request.timeoutMs ?? 35000;
  const endpointUrl = request.endpointUrl ?? '/api/analyze-meal';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageDataUrl: request.image.previewUrl,
        mimeType: request.image.mimeType,
        fileName: request.image.fileName,
        sizeBytes: request.image.sizeBytes,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        `Meal image analysis timed out after ${Math.round(timeoutMs / 1000)} seconds. Please retry.`
      );
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        `Meal image analysis timed out after ${Math.round(timeoutMs / 1000)} seconds. Please retry.`
      );
    }
    throw new Error(
      'Network error while contacting the meal analysis server. Please check your connection and try again.'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let rawText: string;
  try {
    rawText = await response.text();
  } catch {
    throw new Error('Failed to read the response from the meal analysis server.');
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Server returned malformed JSON (HTTP ${response.status}). Please retry analysis.`
    );
  }

  if (!response.ok) {
    if (parsedBody && typeof parsedBody === 'object') {
      const errField = (parsedBody as Record<string, unknown>).error;
      if (errField && typeof errField === 'object') {
        const msg = (errField as Record<string, unknown>).message;
        if (typeof msg === 'string' && msg.trim()) {
          throw new Error(msg.trim());
        }
      }
    }
    throw new Error(
      `Meal analysis request failed with status ${response.status}.`
    );
  }

  return validateAnalysisApiResponse(parsedBody);
}
