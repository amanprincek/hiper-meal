import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_CATEGORIES = new Set([
  'produce',
  'protein',
  'grains',
  'dairy',
  'oils',
]);

const MAX_BINARY_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const OPEN_FOOD_FACTS_USER_AGENT =
  'HiperMeal/1.0 (https://aistudio.google.com; contact@hipermeal.example)';

export interface RawDetectedItem {
  name: string;
  category: 'produce' | 'protein' | 'grains' | 'dairy' | 'oils';
  estimatedPortionGrams: number;
  confidenceScore?: number;
  identificationNote?: string;
}

export interface ValidatedModelAnalysis {
  isFoodImage: boolean;
  overallNote: string;
  items: RawDetectedItem[];
}

/**
 * Verifies magic bytes for JPEG, PNG, and WebP buffers so non-image binary data
 * is rejected even if wrapped in a data:image/* prefix.
 */
export function hasValidImageMagicBytes(
  buffer: Buffer,
  mimeType: string
): boolean {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  const normalized = mimeType.toLowerCase();

  // JPEG: FF D8 FF
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (normalized === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  // WebP: "RIFF" .... "WEBP"
  if (normalized === 'image/webp') {
    if (buffer.length < 12) return false;
    const riff = buffer.subarray(0, 4).toString('ascii');
    const webp = buffer.subarray(8, 12).toString('ascii');
    return riff === 'RIFF' && webp === 'WEBP';
  }

  return false;
}

/**
 * Parses and strictly validates the JSON text returned by the vision model.
 * Throws a descriptive error if the response is malformed or does not match the schema.
 */
export function parseAndValidateModelOutput(
  rawText: string | undefined
): ValidatedModelAnalysis {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('Model returned an empty response.');
  }

  // Strip optional markdown code fences if present
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Model returned malformed JSON output.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Model JSON response must be a root object.');
  }

  const record = parsed as Record<string, unknown>;

  if (typeof record.isFoodImage !== 'boolean') {
    throw new Error('Model response missing boolean "isFoodImage" field.');
  }

  if (typeof record.overallNote !== 'string' || !record.overallNote.trim()) {
    throw new Error('Model response missing string "overallNote" field.');
  }

  if (!Array.isArray(record.items)) {
    throw new Error('Model response missing "items" array.');
  }

  const validatedItems: RawDetectedItem[] = [];

  for (const rawItem of record.items) {
    if (!rawItem || typeof rawItem !== 'object') {
      throw new Error('Invalid item entry in model response.');
    }

    const itemObj = rawItem as Record<string, unknown>;
    const rawName = typeof itemObj.name === 'string' ? itemObj.name.trim() : '';
    if (!rawName) {
      throw new Error('Detected food item is missing a valid name.');
    }

    const rawCategory =
      typeof itemObj.category === 'string'
        ? itemObj.category.trim().toLowerCase()
        : '';
    const category = (
      ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : 'produce'
    ) as RawDetectedItem['category'];

    const rawPortion = Number(itemObj.estimatedPortionGrams);
    const estimatedPortionGrams =
      Number.isFinite(rawPortion) && rawPortion > 0
        ? Math.min(Math.round(rawPortion), 5000)
        : 100;

    let confidenceScore: number | undefined = undefined;
    if (
      itemObj.confidenceScore !== undefined &&
      itemObj.confidenceScore !== null
    ) {
      const numConf = Number(itemObj.confidenceScore);
      if (Number.isFinite(numConf)) {
        const normalizedConf = numConf > 1 ? numConf / 100 : numConf;
        confidenceScore = Math.max(
          0,
          Math.min(1, Math.round(normalizedConf * 100) / 100)
        );
      }
    }

    const identificationNote =
      typeof itemObj.identificationNote === 'string' &&
      itemObj.identificationNote.trim().length > 0
        ? itemObj.identificationNote.trim()
        : undefined;

    validatedItems.push({
      name: rawName,
      category,
      estimatedPortionGrams,
      confidenceScore,
      identificationNote,
    });
  }

  return {
    isFoodImage: record.isFoodImage,
    overallNote: record.overallNote.trim(),
    items: validatedItems,
  };
}

const MEAL_ANALYSIS_SYSTEM_INSTRUCTION = `You are a visual nutrition analysis assistant for HiperMeal.
Inspect the uploaded image and identify distinct visible food or beverage items.
Rules:
1. Map every identified food item to one of these exact categories:
   - "produce": Fruits, vegetables, leafy greens, salads, vegetable sabzis, chutneys.
   - "protein": Dal, lentils, chickpeas, rajma, paneer, tofu, eggs, poultry, meat, fish, seafood.
   - "grains": Rice, roti, chapati, naan, paratha, bread, pasta, noodles, oats, idli, dosa, cereal grains, starchy tubers/potatoes.
   - "dairy": Curd, raita, yogurt, milk, lassi, cheese, buttermilk.
   - "oils": Ghee, butter, cooking oil drizzle, fried papad/crisps, nuts, seeds, dressings.
2. Provide an approximate visual portion estimate in grams ("estimatedPortionGrams"). Treat portion estimates as uncertain approximations based on visual volume, standard tableware, or visible packaging labels—never claim exact physical measurements.
3. Provide a "confidenceScore" between 0.0 and 1.0 reflecting visual clarity.
4. Provide a concise "identificationNote" (1 short sentence) noting visual cues, preparation uncertainty, or packaging observations.
5. If the image is blank, a solid color, blurry beyond recognition, or does not contain food, set "isFoodImage" to false, return an empty "items" array [], and explain clearly in "overallNote".`;

const MEAL_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isFoodImage: {
      type: Type.BOOLEAN,
      description:
        'True if recognizable food, meal items, or packaged food are visible in the photo.',
    },
    overallNote: {
      type: Type.STRING,
      description:
        'Brief summary of the meal photo or explanation if no food could be identified.',
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description:
              'Specific, human-readable name of the food item (e.g., "Yellow Dal Tadka", "Whole-Wheat Roti", "Steamed Basmati Rice").',
          },
          category: {
            type: Type.STRING,
            description:
              'Must be one of: produce, protein, grains, dairy, oils.',
          },
          estimatedPortionGrams: {
            type: Type.NUMBER,
            description: 'Approximate visual portion weight in grams (e.g. 150).',
          },
          confidenceScore: {
            type: Type.NUMBER,
            description: 'Confidence score from 0.0 to 1.0.',
          },
          identificationNote: {
            type: Type.STRING,
            description:
              'Short note qualifying the visual estimate or preparation assumptions.',
          },
        },
        required: [
          'name',
          'category',
          'estimatedPortionGrams',
          'confidenceScore',
          'identificationNote',
        ],
      },
    },
  },
  required: ['isFoodImage', 'overallNote', 'items'],
};

export function createApiApp() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = Boolean(
      apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY'
    );
    res.json({
      status: 'ok',
      geminiConfigured: hasValidKey,
      primaryModel: 'gemma-4-26b-a4b-it',
      fallbackModel: 'gemini-3.8-flash',
    });
  });

  /**
   * Dedicated Open Food Facts proxy endpoint (separate from AI vision endpoint).
   * Queries official Open Food Facts Search-a-licious / v2 endpoints with proper
   * User-Agent attribution, timeout handling, and response normalization.
   */
  app.get('/api/nutrition/openfoodfacts', async (req: Request, res: Response) => {
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const barcode =
      typeof req.query.barcode === 'string' ? req.query.barcode.trim() : '';

    if (!rawQuery && !barcode) {
      res.status(400).json({
        error: {
          code: 'MISSING_QUERY',
          message:
            'Query parameter "q" or "barcode" is required for Open Food Facts lookup.',
        },
      });
      return;
    }

    if (req.headers['x-test-simulate-off-timeout'] === 'true') {
      res.status(504).json({
        error: {
          code: 'OPEN_FOOD_FACTS_TIMEOUT',
          message: 'Open Food Facts request timed out.',
        },
      });
      return;
    }

    const fields =
      'code,product_name,product_name_en,brands,nutriments,nutrition_data_per,serving_size';

    try {
      let targetUrl: string;
      if (barcode && /^[0-9]{8,14}$/.test(barcode)) {
        targetUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
          barcode
        )}?fields=${fields}`;
      } else {
        targetUrl = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(
          rawQuery.slice(0, 120)
        )}&page_size=12&fields=${fields}`;
      }

      const upstreamRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': OPEN_FOOD_FACTS_USER_AGENT,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (upstreamRes.status === 429) {
        res.status(429).json({
          error: {
            code: 'OPEN_FOOD_FACTS_RATE_LIMIT',
            message:
              'Open Food Facts rate limit reached. Please wait a moment before retrying.',
          },
        });
        return;
      }

      if (!upstreamRes.ok) {
        res.status(502).json({
          error: {
            code: 'OPEN_FOOD_FACTS_UPSTREAM_ERROR',
            message: `Open Food Facts returned HTTP ${upstreamRes.status}.`,
          },
        });
        return;
      }

      const data = (await upstreamRes.json()) as Record<string, unknown>;

      let products: unknown[] = [];
      if (Array.isArray(data.hits)) {
        products = data.hits;
      } else if (Array.isArray(data.products)) {
        products = data.products;
      } else if (data.product && typeof data.product === 'object') {
        products = [data.product];
      }

      res.status(200).json({
        status: 'OK',
        query: rawQuery || barcode,
        products,
        attribution:
          'Open Food Facts (https://world.openfoodfacts.org) — Open Database License (ODbL)',
      });
    } catch (err) {
      const isTimeout =
        err instanceof Error &&
        (err.name === 'TimeoutError' || err.name === 'AbortError');

      res.status(isTimeout ? 504 : 502).json({
        error: {
          code: isTimeout
            ? 'OPEN_FOOD_FACTS_TIMEOUT'
            : 'OPEN_FOOD_FACTS_NETWORK_ERROR',
          message: isTimeout
            ? 'Open Food Facts lookup timed out after 8 seconds.'
            : 'Unable to reach Open Food Facts API.',
        },
      });
    }
  });

  app.post('/api/analyze-meal', async (req: Request, res: Response) => {
    try {
      const apiKey =
        req.headers['x-test-simulate-missing-key'] === 'true'
          ? ''
          : process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error: {
            code: 'MISSING_API_KEY',
            message:
              'Server-side GEMINI_API_KEY is missing or not configured. Please check Settings > Secrets in AI Studio.',
          },
        });
        return;
      }

      const { imageDataUrl, mimeType, fileName } = req.body ?? {};

      if (!imageDataUrl || typeof imageDataUrl !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'Request body must include a valid "imageDataUrl" string.',
          },
        });
        return;
      }

      const match = imageDataUrl.match(
        /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/
      );
      if (!match) {
        res.status(400).json({
          error: {
            code: 'INVALID_DATA_URL',
            message:
              'Uploaded image must be encoded as a valid base64 data URL (JPG, JPEG, PNG, or WebP).',
          },
        });
        return;
      }

      const detectedMime = (mimeType || match[1]).trim().toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(detectedMime)) {
        res.status(400).json({
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `Unsupported image MIME type "${detectedMime}". Allowed types: JPG, JPEG, PNG, WebP.`,
          },
        });
        return;
      }

      const base64Data = match[2].replace(/[\r\n]/g, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      if (imageBuffer.length === 0) {
        res.status(400).json({
          error: {
            code: 'EMPTY_IMAGE',
            message: 'Decoded image payload contains 0 bytes.',
          },
        });
        return;
      }

      if (imageBuffer.length > MAX_BINARY_SIZE_BYTES) {
        res.status(413).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'Decoded image exceeds the 10.00 MB maximum size limit.',
          },
        });
        return;
      }

      if (!hasValidImageMagicBytes(imageBuffer, detectedMime)) {
        res.status(400).json({
          error: {
            code: 'CORRUPTED_IMAGE',
            message:
              'The uploaded file header does not match a valid JPEG, PNG, or WebP image.',
          },
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const canonicalMime =
        detectedMime === 'image/jpg' ? 'image/jpeg' : detectedMime;

      const promptText = `Analyze this meal photograph${
        fileName ? ` (filename hint: "${String(fileName).slice(0, 80)}")` : ''
      }. Identify each visible food item, assign its food category (produce, protein, grains, dairy, or oils), estimate its approximate portion weight in grams, provide a confidence score (0.0 to 1.0), and include a brief identification note explaining any visual uncertainty.`;

      let rawModelText: string | undefined;
      let modelUsed = 'gemma-4-26b-a4b-it';

      try {
        const primaryResponse = await ai.models.generateContent({
          model: 'gemma-4-26b-a4b-it',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: canonicalMime,
                  data: base64Data,
                },
              },
              { text: promptText },
            ],
          },
          config: {
            systemInstruction: MEAL_ANALYSIS_SYSTEM_INSTRUCTION,
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: MEAL_ANALYSIS_SCHEMA,
          },
        });
        rawModelText = primaryResponse.text;
      } catch (primaryErr) {
        modelUsed = 'gemini-3.8-flash';
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: canonicalMime,
                  data: base64Data,
                },
              },
              { text: promptText },
            ],
          },
          config: {
            systemInstruction: MEAL_ANALYSIS_SYSTEM_INSTRUCTION,
            temperature: 0.2,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: MEAL_ANALYSIS_SCHEMA,
          },
        });
        rawModelText = fallbackResponse.text;
        void primaryErr;
      }

      let validated: ValidatedModelAnalysis;
      try {
        validated = parseAndValidateModelOutput(rawModelText);
      } catch (parseErr) {
        res.status(502).json({
          error: {
            code: 'INVALID_MODEL_RESPONSE',
            message:
              parseErr instanceof Error
                ? parseErr.message
                : 'Vision model returned an unparseable response.',
          },
        });
        return;
      }

      const timestampIso = new Date().toISOString();
      const itemsWithIds = validated.items.map((item, idx) => ({
        id: `detected-${Date.now()}-${idx}`,
        name: item.name,
        category: item.category,
        estimatedPortionGrams: item.estimatedPortionGrams,
        confidenceScore: item.confidenceScore,
        identificationNote: item.identificationNote,
        userCorrected: false,
        isManuallyAdded: false,
      }));

      res.status(200).json({
        status: 'SUCCESS',
        modelUsed,
        isFoodImage: validated.isFoodImage,
        overallNote: validated.overallNote,
        items: itemsWithIds,
        timestampIso,
      });
    } catch (err) {
      const rawMessage =
        err instanceof Error ? err.message : 'Unexpected server error.';

      const isAuthError =
        rawMessage.includes('API_KEY_INVALID') ||
        rawMessage.includes('PERMISSION_DENIED') ||
        rawMessage.includes('403') ||
        rawMessage.includes('401');

      if (isAuthError) {
        res.status(403).json({
          error: {
            code: 'AUTHENTICATION_ERROR',
            message:
              'Model authentication failed. Please check your GEMINI_API_KEY in the AI Studio Settings > Secrets panel.',
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'MODEL_EXECUTION_ERROR',
          message: `Failed to analyze meal image: ${rawMessage}`,
        },
      });
    }
  });

  return app;
}

async function startServer() {
  const app = createApiApp();
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HiperMeal server listening on http://0.0.0.0:${PORT}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  startServer().catch((err) => {
    console.error('Failed to start HiperMeal server:', err);
    process.exit(1);
  });
}
