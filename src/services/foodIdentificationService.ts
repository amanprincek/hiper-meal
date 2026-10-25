import { DetectedFoodItem, UploadedMealImage } from '../types/nutrition';

export interface FoodIdentificationRequest {
  image: UploadedMealImage;
}

export interface FoodIdentificationResponse {
  status: 'PHASE_1_BOUNDARY_REACHED' | 'SUCCESS';
  items: DetectedFoodItem[];
  message: string;
  timestampIso: string;
}

/**
 * Service boundary for visual food identification.
 *
 * In Phase 1, this module validates the uploaded image payload and returns
 * an explicit boundary status without returning fabricated detections.
 * Phase 2 will connect this boundary to server-side vision analysis.
 */
export async function identifyFoodItemsInMeal(
  request: FoodIdentificationRequest
): Promise<FoodIdentificationResponse> {
  if (!request?.image?.previewUrl || request.image.sizeBytes <= 0) {
    throw new Error('A valid meal image is required before running analysis.');
  }

  // Brief asynchronous boundary transition to verify loading states cleanly
  await new Promise((resolve) => setTimeout(resolve, 450));

  return {
    status: 'PHASE_1_BOUNDARY_REACHED',
    items: [],
    message:
      'Image payload verified and staged for analysis. AI food identification is reserved for Phase 2 and does not return fabricated detections in Phase 1.',
    timestampIso: new Date().toISOString(),
  };
}
