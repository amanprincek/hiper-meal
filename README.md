# HiperMeal — AI Visual Nutrition Diary

HiperMeal is an AI-assisted visual nutrition diary built with React 19, TypeScript, Tailwind CSS, Express, and the `@google/genai` SDK. Users upload a meal photo, inspect and edit AI-detected food items and serving weights, and calculate verified nutrition totals sourced strictly from documented Indian nutrition tables (ICMR-NIN IFCT 2017 / USDA FDC) and the live Open Food Facts API.

## Core Principles

1. **AI for Visual Identification Only**: Vision models (`gemma-4-26b-a4b-it` primary, `gemini-3.8-flash` fallback) identify visible dishes, assign a visual category badge, and provide an approximate serving weight (`~g`). AI is **never** used to invent calorie or macronutrient numbers.
2. **Traceable Nutrition Sources**:
   - **Local Indian Food Reference Dataset (`src/data/indianFoodDataset.ts`)**: 19 documented entries per 100g with explicit preparation assumptions and citations to **ICMR-NIN Indian Food Composition Tables (IFCT 2017)** and **USDA FoodData Central (SR Legacy)**.
   - **Live Open Food Facts Integration (`GET /api/nutrition/openfoodfacts`)**: Queries the Open Food Facts search API for packaged products and validates relevance (`>= 0.5`), per-100g basis, energy/macro units (`kcal`, `g`), and missing nutrient fields (`null` preserved rather than fabricated as `0`).
3. **Human-in-the-Loop Verification**: Users can rename items, clarify ambiguous generic names (e.g., `"Dal"`, `"Rice"`, `"Sabzi"`), adjust serving sizes in grams, add missing items manually, remove false detections, or reset the workspace at any time with **Start New Meal**.

## Architecture

- `src/App.tsx`: Main application state, session-safe request lifecycle (`AbortController` + generation ID), and 2-column workspace layout.
- `src/components/MealImageUploader.tsx`: Drag-and-drop / file picker upload, client-side format/size/dimension verification, preview, and **Start New Meal** reset action.
- `src/components/AnalysisResultsPanel.tsx`: Editable food item cards, ambiguity resolution selector, per-item scaled macro strip, source attribution, and meal-level nutrition totals with incomplete-data warnings.
- `src/components/CategoryTypeLegend.tsx`: Pokémon-type-inspired food category reference (Grass/Produce, Fighting/Protein, Ground/Grains, Ice/Dairy, Fire/Fats & Oils).
- `src/data/indianFoodDataset.ts`: Documented per-100g nutrition dataset for common Indian staples and ambiguity groups.
- `src/services/foodIdentificationService.ts`: Client service for `POST /api/analyze-meal` with schema validation and abort/timeout support.
- `src/services/nutritionLookupService.ts` & `src/services/openFoodFactsValidator.ts`: Multi-stage nutrition lookup and strict Open Food Facts product validation.
- `src/utils/nutritionCalculator.ts`: Deterministic portion scaling (`(valuePer100g * portionGrams) / 100`) and meal-level aggregation that preserves `null` for missing nutrients.
- `server.ts`: Express server + Vite middleware protecting `GEMINI_API_KEY` on the server and exposing `POST /api/analyze-meal`, `GET /api/nutrition/openfoodfacts`, and `GET /api/health`.

## Setup & Running Locally

### Prerequisites

- Node.js 20+
- A valid `GEMINI_API_KEY` set in your environment or `.env` file (see `.env.example`).

### Installation & Development

```bash
npm install
npm run dev
```

The application starts on `http://localhost:3000`.

### Typecheck & Production Build

```bash
npm run lint
npm run build
npm start
```

## Known Limitations

- **Visual Portion Uncertainty**: Gram weights estimated from a single 2D photograph are approximations and should be confirmed or adjusted by the user.
- **Homemade Recipe Variability**: Reference values in the local ICMR-NIN dataset represent standard domestic preparations; household variations in oil, ghee, or water content will shift actual caloric density.
- **External API Availability**: Packaged-food lookups depend on live Open Food Facts availability and product catalog completeness (for example, some branded products omit dietary fiber on their label, which HiperMeal reports as `N/A` and flags in the meal summary).

## Data & API Attribution

- **Open Food Facts**: Packaged food nutrition records are retrieved live from [Open Food Facts](https://world.openfoodfacts.org/), an open collaborative database licensed under the [Open Database License (ODbL 1.0)](https://opendatacommons.org/licenses/odbl/1-0/).
- **ICMR-NIN Indian Food Composition Tables (IFCT 2017)**: Reference values and cooked hydration/recipe equivalents for Indian staples are derived from T. Longvah et al., *Indian Food Composition Tables*, National Institute of Nutrition (ICMR), Hyderabad (2017), and *Dietary Guidelines for Indians*.
- **USDA FoodData Central (SR Legacy)**: Single-ingredient cooked and raw food reference values are cross-referenced against the U.S. Department of Agriculture, Agricultural Research Service, FoodData Central Standard Reference Legacy.
- **Google GenAI SDK (`@google/genai`)**: Server-side visual food detection uses `gemma-4-26b-a4b-it` (primary) with `gemini-3.8-flash` (fallback).

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for details.
