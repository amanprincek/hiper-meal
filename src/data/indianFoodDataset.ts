import {
  FoodCategory,
  MacroNutrients,
  NutritionCandidateMatch,
} from '../types/nutrition';

export interface LocalIndianFoodEntry {
  id: string;
  name: string;
  description: string;
  category: FoodCategory;
  aliases: string[];
  ambiguityGroup?: string;
  nutritionPer100g: MacroNutrients;
  sourceReference: string;
  preparationAssumptions: string;
}

/**
 * Curated, documented reference dataset for common Indian foods and staple meal components.
 *
 * Reference Sources:
 * - ICMR-NIN IFCT 2017: T. Longvah et al., "Indian Food Composition Tables",
 *   National Institute of Nutrition (ICMR), Hyderabad, 2017 (and standard cooked
 *   hydrated recipe equivalents from NIN "Dietary Guidelines for Indians").
 * - USDA FDC SR Legacy: U.S. Department of Agriculture, Agricultural Research Service,
 *   FoodData Central Standard Reference Legacy (for single-ingredient cooked staples).
 *
 * Important Note:
 * Values represent generic standard reference averages per 100g of cooked edible portion,
 * NOT physical laboratory measurements of a specific homemade or restaurant dish.
 */
export const LOCAL_INDIAN_FOOD_DATASET: LocalIndianFoodEntry[] = [
  {
    id: 'ind-cooked-white-rice',
    name: 'Cooked White Rice (Boiled / Steamed)',
    description:
      'Plain boiled or steamed white rice (milled raw/basmati rice, cooked in water without added fat or salt).',
    category: FoodCategory.GRAINS,
    aliases: [
      'cooked white rice',
      'steamed basmati rice',
      'steamed white rice',
      'boiled rice',
      'plain white rice',
      'basmati rice',
      'white rice',
      'chawal',
      'steamed rice',
    ],
    ambiguityGroup: 'rice',
    nutritionPer100g: {
      caloriesKcal: 130,
      proteinGrams: 2.7,
      carbsGrams: 28.2,
      fatGrams: 0.3,
      fiberGrams: 0.4,
    },
    sourceReference:
      'ICMR-NIN IFCT 2017 (Raw Milled Rice A015 hydrated 1:2.8 cooked weight equivalent) / USDA FDC #168878',
    preparationAssumptions:
      'Generic reference for plain steamed/boiled white rice (~68% moisture, 0g added oil/ghee). Homemade jeera rice or pulao will have higher fat and calorie density.',
  },
  {
    id: 'ind-cooked-brown-rice',
    name: 'Cooked Brown Rice (Boiled / Steamed)',
    description:
      'Plain boiled unmilled whole-grain brown rice cooked in water without added oil or fat.',
    category: FoodCategory.GRAINS,
    aliases: [
      'cooked brown rice',
      'steamed brown rice',
      'boiled brown rice',
      'brown rice',
    ],
    ambiguityGroup: 'rice',
    nutritionPer100g: {
      caloriesKcal: 123,
      proteinGrams: 2.7,
      carbsGrams: 25.6,
      fatGrams: 1.0,
      fiberGrams: 1.6,
    },
    sourceReference:
      'ICMR-NIN IFCT 2017 (Brown Rice A014 cooked hydration equivalent) / USDA FDC #169704',
    preparationAssumptions:
      'Generic reference for plain boiled brown rice without added cooking oil or butter.',
  },
  {
    id: 'ind-whole-wheat-roti',
    name: 'Whole-Wheat Roti / Chapati (Dry-Roasted Phulka)',
    description:
      'Unleavened Indian flatbread made from whole-wheat flour (atta) and water, dry-roasted on a tawa without ghee.',
    category: FoodCategory.GRAINS,
    aliases: [
      'whole-wheat roti',
      'whole wheat roti',
      'roti',
      'chapati',
      'phulka',
      '2 whole-wheat rotis',
      'wheat roti',
      'plain roti',
      'rotis',
    ],
    ambiguityGroup: 'flatbread',
    nutritionPer100g: {
      caloriesKcal: 297,
      proteinGrams: 9.8,
      carbsGrams: 61.2,
      fatGrams: 1.7,
      fiberGrams: 9.2,
    },
    sourceReference:
      'ICMR-NIN IFCT 2017 (Whole Wheat Flour A019 cooked phulka moisture-adjusted ~15% hydration retention)',
    preparationAssumptions:
      'Generic reference for dry-roasted whole-wheat phulka/roti with no brushed ghee. Brushing 1 tsp (5g) ghee per roti adds ~45 kcal and 5g fat.',
  },
  {
    id: 'ind-whole-wheat-paratha',
    name: 'Whole-Wheat Plain Paratha (Pan-Cooked with Oil/Ghee)',
    description:
      'Layered whole-wheat flatbread shallow-roasted on a griddle with a moderate amount of oil or ghee.',
    category: FoodCategory.GRAINS,
    aliases: [
      'plain paratha',
      'wheat paratha',
      'paratha',
      'parantha',
      'whole-wheat paratha',
    ],
    ambiguityGroup: 'flatbread',
    nutritionPer100g: {
      caloriesKcal: 326,
      proteinGrams: 8.6,
      carbsGrams: 51.8,
      fatGrams: 9.4,
      fiberGrams: 7.5,
    },
    sourceReference:
      'ICMR-NIN Dietary Guidelines for Indians (Standard Cooked Paratha Recipe Equivalent)',
    preparationAssumptions:
      'Generic reference assuming ~8g cooking oil/ghee per 100g cooked paratha. Home or restaurant parathas may vary substantially in fat content.',
  },
  {
    id: 'ind-toor-dal-tadka',
    name: 'Cooked Yellow Toor Dal Tadka (Pigeon Pea Lentil Curry)',
    description:
      'Boiled split pigeon pea lentils (toor/arhar dal) seasoned with spices, onion, tomato, and light oil/ghee tempering (tadka).',
    category: FoodCategory.PROTEIN,
    aliases: [
      'yellow dal tadka',
      'toor dal tadka',
      'arhar dal',
      'toor dal',
      'yellow dal',
      'dal tadka',
      'dal fry',
      'home-style toor dal tadka',
      'yellow dal tadka (lentil curry)',
    ],
    ambiguityGroup: 'dal',
    nutritionPer100g: {
      caloriesKcal: 118,
      proteinGrams: 6.4,
      carbsGrams: 16.5,
      fatGrams: 2.9,
      fiberGrams: 3.4,
    },
    sourceReference:
      'ICMR-NIN IFCT 2017 (Red Gram Dal B013 cooked 1:3.5 dilution with 2.5g tempering oil/ghee per 100g)',
    preparationAssumptions:
      'Generic reference assuming medium consistency (28g dry dal + 2.5g oil/ghee per 100g cooked curry). Thicker restaurant dal fry with extra butter will have higher calories.',
  },
  {
    id: 'ind-moong-dal-plain',
    name: 'Cooked Yellow Moong Dal (Boiled Split Green Gram)',
    description:
      'Lightly spiced boiled yellow split moong dal prepared with minimal oil.',
    category: FoodCategory.PROTEIN,
    aliases: [
      'moong dal',
      'yellow moong dal',
      'cooked moong dal',
      'plain moong dal',
    ],
    ambiguityGroup: 'dal',
    nutritionPer100g: {
      caloriesKcal: 105,
      proteinGrams: 7.0,
      carbsGrams: 17.2,
      fatGrams: 0.9,
      fiberGrams: 2.8,
    },
    sourceReference:
      'ICMR-NIN IFCT 2017 (Green Gram Dal B008 cooked 1:3.5 hydration equivalent)',
    preparationAssumptions:
      'Generic reference for home-style boiled moong dal with <1g tempering oil per 100g.',
  },
  {
    id: 'ind-dal-makhani',
    name: 'Cooked Dal Makhani (Whole Black Gram & Kidney Beans)',
    description:
      'Slow-cooked whole black urad dal and rajma simmered with tomato puree, butter, and cream.',
    category: FoodCategory.PROTEIN,
    aliases: ['dal makhani', 'makhani dal', 'black dal', 'maa ki dal'],
    ambiguityGroup: 'dal',
    nutritionPer100g: {
      caloriesKcal: 152,
      proteinGrams: 6.2,
      carbsGrams: 16.8,
      fatGrams: 6.6,
      fiberGrams: 4.1,
    },
    sourceReference:
      'ICMR-NIN IFCT 2017 (Black Gram Whole B003 + Butter/Cream standard North Indian recipe calculation)',
    preparationAssumptions:
      'Generic reference assuming moderate butter/cream (~6g dairy fat per 100g). Heavy restaurant preparations can exceed 200 kcal/100g.',
  },
  {
    id: 'ind-plain-curd',
    name: 'Plain Curd / Dahi (Whole Milk Yogurt)',
    description:
      'Unsweetened fermented whole-milk curd (dahi) without added sugar or fried boondi.',
    category: FoodCategory.DAIRY,
    aliases: [
      'plain curd',
      'curd',
      'dahi',
      'plain dahi',
      'whole milk curd',
      'yogurt',
      'plain yogurt',
    ],
    ambiguityGroup: 'curd',
    nutritionPer100g: {
      caloriesKcal: 61,
      proteinGrams: 3.5,
      carbsGrams: 4.7,
      fatGrams: 3.3,
      fiberGrams: 0.0,
    },
    sourceReference:
      'ICMR-NIN IFCT 2017 / USDA FDC #171284 (Yogurt, plain, whole milk)',
    preparationAssumptions:
      'Generic reference for standard cow/toned-milk curd (~3.3% fat). Buffalo-milk curd has higher fat (~5–6g/100g).',
  },
  {
    id: 'ind-cucumber-raita',
    name: 'Cucumber Curd Raita (Yogurt with Grated Cucumber)',
    description:
      'Whisked plain curd mixed with raw grated cucumber, roasted cumin powder, and herbs.',
    category: FoodCategory.DAIRY,
    aliases: [
      'cucumber raita',
      'cucumber raita (yogurt)',
      'vegetable raita',
      'raita',
      'kheera raita',
    ],
    ambiguityGroup: 'curd',
    nutritionPer100g: {
      caloriesKcal: 50,
      proteinGrams: 2.9,
      carbsGrams: 4.2,
      fatGrams: 2.4,
      fiberGrams: 0.4,
    },
    sourceReference:
      'ICMR-NIN IFCT 2017Composite (75% Plain Curd + 25% Raw Cucumber D019)',
    preparationAssumptions:
      'Generic reference for vegetable/cucumber raita without fried gram-flour boondi.',
  },
  {
    id: 'ind-boiled-potato',
    name: 'Boiled Potato (Peeled, Plain Cooked)',
    description:
      'Plain boiled starchy potato flesh cooked in water without added oil, butter, or spices.',
    category: FoodCategory.GRAINS,
    aliases: [
      'boiled potato',
      'boiled potatoes',
      'steamed potato',
      'plain boiled aloo',
    ],
    nutritionPer100g: {
      caloriesKcal: 86,
      proteinGrams: 1.7,
      carbsGrams: 20.0,
      fatGrams: 0.1,
      fiberGrams: 1.8,
    },
    sourceReference:
      'ICMR-NIN IFCT 2017 (Potato Brown F006 boiled equivalent) / USDA FDC #170030',
    preparationAssumptions:
      'Generic reference for plain boiled potato with 0g added cooking fat.',
  },
  {
    id: 'ind-cooked-chickpeas',
    name: 'Cooked Chickpeas / Chana (Boiled Kabuli Chana)',
    description:
      'Boiled whole chickpeas (Kabuli chana / garbanzo beans) cooked until tender.',
    category: FoodCategory.PROTEIN,
    aliases: [
      'cooked chickpeas',
      'boiled chickpeas',
      'kabuli chana',
      'chana',
      'chickpeas',
      'garbanzo beans',
    ],
    nutritionPer100g: {
      caloriesKcal: 164,
      proteinGrams: 8.9,
      carbsGrams: 27.4,
      fatGrams: 2.6,
      fiberGrams: 7.6,
    },
    sourceReference:
      'ICMR-NIN IFCT 2017 (Bengal Gram Whole B002 boiled equivalent) / USDA FDC #173757',
    preparationAssumptions:
      'Generic reference for boiled chickpeas. Spiced chole curry cooked with oil/ghee will add ~30–60 kcal per 100g.',
  },
  {
    id: 'ind-aloo-gobi-sabzi',
    name: 'Cooked Aloo Gobi Sabzi (Potato & Cauliflower Stir-Fry)',
    description:
      'Dry Indian vegetable preparation of diced potatoes and cauliflower florets sautéed with turmeric, cumin, and vegetable oil.',
    category: FoodCategory.PRODUCE,
    aliases: [
      'aloo gobi',
      'aloo gobi sabzi',
      'potato cauliflower sabzi',
      'gobi aloo',
      'mixed vegetable sabzi',
    ],
    ambiguityGroup: 'sabzi',
    nutritionPer100g: {
      caloriesKcal: 98,
      proteinGrams: 2.1,
      carbsGrams: 12.8,
      fatGrams: 4.2,
      fiberGrams: 2.5,
    },
    sourceReference:
      'ICMR-NIN IFCT 2017 Composite (Cauliflower D012 + Potato F006 + 4g cooking oil per 100g)',
    preparationAssumptions:
      'Generic reference assuming 4g cooking oil per 100g cooked sabzi.',
  },
  {
    id: 'ind-palak-paneer',
    name: 'Cooked Palak Paneer (Spinach with Indian Cottage Cheese)',
    description:
      'Blanched spinach puree cooked with cubes of paneer (Indian cottage cheese), onion, tomato, and mild spices.',
    category: FoodCategory.PROTEIN,
    aliases: ['palak paneer', 'saag paneer', 'spinach paneer'],
    ambiguityGroup: 'sabzi',
    nutritionPer100g: {
      caloriesKcal: 165,
      proteinGrams: 8.8,
      carbsGrams: 6.4,
      fatGrams: 11.8,
      fiberGrams: 2.2,
    },
    sourceReference:
      'ICMR-NIN IFCT 2017 Composite (Spinach C031 + Paneer L005 in 65:35 cooked ratio)',
    preparationAssumptions:
      'Generic reference assuming ~35g paneer per 100g dish. Varies with paneer-to-spinach ratio and added cream.',
  },
  {
    id: 'ind-steamed-broccoli',
    name: 'Steamed Broccoli Florets (Plain Cooked)',
    description:
      'Fresh green broccoli florets steamed until tender without butter or oil.',
    category: FoodCategory.PRODUCE,
    aliases: [
      'steamed broccoli florets',
      'steamed broccoli',
      'boiled broccoli',
      'cooked broccoli',
      'broccoli florets',
      'broccoli',
    ],
    nutritionPer100g: {
      caloriesKcal: 35,
      proteinGrams: 2.4,
      carbsGrams: 7.2,
      fatGrams: 0.4,
      fiberGrams: 3.3,
    },
    sourceReference: 'USDA FoodData Central SR Legacy #170379 (Broccoli, cooked, boiled, drained)',
    preparationAssumptions:
      'Generic reference for plain steamed/boiled broccoli without oil or dressing.',
  },
  {
    id: 'ind-grilled-salmon',
    name: 'Grilled Salmon Fillet (Dry-Heat Cooked)',
    description:
      'Boneless salmon fillet cooked by grilling or baking without breading or heavy sauce.',
    category: FoodCategory.PROTEIN,
    aliases: [
      'grilled salmon fillet',
      'grilled salmon',
      'cooked salmon',
      'baked salmon',
      'salmon fillet',
    ],
    nutritionPer100g: {
      caloriesKcal: 206,
      proteinGrams: 22.1,
      carbsGrams: 0.0,
      fatGrams: 12.4,
      fiberGrams: 0.0,
    },
    sourceReference: 'USDA FoodData Central SR Legacy #175168 (Fish, salmon, Atlantic, cooked, dry heat)',
    preparationAssumptions:
      'Generic reference for dry-heat grilled salmon fillet.',
  },
  {
    id: 'ind-cooking-olive-oil',
    name: 'Extra-Virgin Olive Oil / Cooking Oil',
    description: 'Pure culinary vegetable or olive oil used for cooking or dressing.',
    category: FoodCategory.OILS,
    aliases: [
      'olive oil',
      'extra-virgin olive oil',
      'cooking oil',
      'vegetable oil',
      'mustard oil',
      'sunflower oil',
    ],
    nutritionPer100g: {
      caloriesKcal: 884,
      proteinGrams: 0.0,
      carbsGrams: 0.0,
      fatGrams: 100.0,
      fiberGrams: 0.0,
    },
    sourceReference: 'ICMR-NIN IFCT 2017 / USDA FDC #171413 (Oil, olive, salad or cooking)',
    preparationAssumptions: 'Pure liquid culinary fat (100% lipid).',
  },
];

const GENERIC_AMBIGUOUS_QUERIES: Record<string, string[]> = {
  dal: ['ind-toor-dal-tadka', 'ind-moong-dal-plain', 'ind-dal-makhani'],
  lentils: ['ind-toor-dal-tadka', 'ind-moong-dal-plain', 'ind-dal-makhani'],
  'lentil curry': ['ind-toor-dal-tadka', 'ind-moong-dal-plain', 'ind-dal-makhani'],
  rice: ['ind-cooked-white-rice', 'ind-cooked-brown-rice'],
  'cooked rice': ['ind-cooked-white-rice', 'ind-cooked-brown-rice'],
  flatbread: ['ind-whole-wheat-roti', 'ind-whole-wheat-paratha'],
  'indian bread': ['ind-whole-wheat-roti', 'ind-whole-wheat-paratha'],
  sabzi: ['ind-aloo-gobi-sabzi', 'ind-palak-paneer'],
  'cooked vegetables': ['ind-aloo-gobi-sabzi', 'ind-steamed-broccoli'],
};

const PACKAGED_FOOD_KEYWORDS = [
  'packaged',
  'packet',
  'bag',
  'brand',
  'chips',
  'crisps',
  'biscuit',
  'biscuits',
  'cookie',
  'cookies',
  'chocolate',
  'nutella',
  'oreo',
  'lays',
  "lay's",
  'haldiram',
  "haldiram's",
  'kurkure',
  'maggi',
  'noodles',
  'cornflakes',
  'muesli',
  'protein bar',
  'energy bar',
  'soda',
  'cola',
  'ketchup',
  'peanut butter',
  'greek yogurt',
  'plain greek yogurt',
  'classic salted potato chips',
  'salted potato chips',
  'potato chips',
];

export function normalizeFoodQuery(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[~0-9]+g\b/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isLikelyPackagedFoodQuery(foodName: string): boolean {
  const lower = foodName.toLowerCase();
  const normalized = normalizeFoodQuery(foodName);
  return PACKAGED_FOOD_KEYWORDS.some(
    (kw) => lower.includes(kw) || normalized.includes(kw)
  );
}

export function entryToCandidateMatch(
  entry: LocalIndianFoodEntry
): NutritionCandidateMatch {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    sourceType: 'LOCAL_INDIAN_DATASET',
    sourceReference: entry.sourceReference,
    preparationAssumptions: entry.preparationAssumptions,
    nutritionPer100g: entry.nutritionPer100g,
  };
}

export interface LocalDatasetSearchResult {
  status: 'MATCHED' | 'AMBIGUOUS' | 'NOT_FOUND';
  matchedEntry?: LocalIndianFoodEntry;
  candidates: NutritionCandidateMatch[];
}

/**
 * Searches the local Indian-food dataset.
 * - Never matches packaged food queries (those are routed to Open Food Facts).
 * - Returns AMBIGUOUS when a generic food term (e.g., "dal", "lentils", "rice", "sabzi")
 *   requires the user to clarify the exact preparation.
 */
export function searchLocalIndianDataset(
  foodName: string
): LocalDatasetSearchResult {
  if (isLikelyPackagedFoodQuery(foodName)) {
    return { status: 'NOT_FOUND', candidates: [] };
  }

  const normalized = normalizeFoodQuery(foodName);
  const rawLower = foodName.toLowerCase().trim();

  if (!normalized) {
    return { status: 'NOT_FOUND', candidates: [] };
  }

  // 1. Check if the query is an explicitly ambiguous generic term
  const ambiguousIds = GENERIC_AMBIGUOUS_QUERIES[normalized];
  if (ambiguousIds) {
    const candidates = LOCAL_INDIAN_FOOD_DATASET.filter((e) =>
      ambiguousIds.includes(e.id)
    ).map(entryToCandidateMatch);
    return {
      status: 'AMBIGUOUS',
      candidates,
    };
  }

  // 2. Check for exact alias or canonical name match
  for (const entry of LOCAL_INDIAN_FOOD_DATASET) {
    if (
      entry.name.toLowerCase() === rawLower ||
      entry.name.toLowerCase() === normalized ||
      entry.aliases.some(
        (alias) => alias === rawLower || alias === normalized
      )
    ) {
      return {
        status: 'MATCHED',
        matchedEntry: entry,
        candidates: [entryToCandidateMatch(entry)],
      };
    }
  }

  // 3. Check substring alias matches (e.g., "2 Whole-Wheat Rotis" -> "whole-wheat roti")
  const matchedEntries: LocalIndianFoodEntry[] = [];
  for (const entry of LOCAL_INDIAN_FOOD_DATASET) {
    const hasPhraseMatch = entry.aliases.some((alias) => {
      if (alias.length < 4) return false;
      return normalized.includes(alias) || alias.includes(normalized);
    });
    if (hasPhraseMatch) {
      matchedEntries.push(entry);
    }
  }

  if (matchedEntries.length === 1) {
    return {
      status: 'MATCHED',
      matchedEntry: matchedEntries[0],
      candidates: [entryToCandidateMatch(matchedEntries[0])],
    };
  }

  if (matchedEntries.length > 1) {
    return {
      status: 'AMBIGUOUS',
      candidates: matchedEntries.map(entryToCandidateMatch),
    };
  }

  return { status: 'NOT_FOUND', candidates: [] };
}
