import React, { useState } from 'react';
import {
  FOOD_CATEGORY_TAXONOMY,
  FoodCategory,
} from '../types/nutrition';

const ORDERED_CATEGORIES: FoodCategory[] = [
  FoodCategory.PRODUCE,
  FoodCategory.PROTEIN,
  FoodCategory.GRAINS,
  FoodCategory.DAIRY,
  FoodCategory.OILS,
];

export const CategoryTypeLegend: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>(
    FoodCategory.PRODUCE
  );

  const activeTaxonomy = FOOD_CATEGORY_TAXONOMY[selectedCategory];

  return (
    <section
      id="category-taxonomy"
      aria-labelledby="taxonomy-heading"
      className="bg-white border border-slate-200 rounded-2xl p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2
            id="taxonomy-heading"
            className="text-lg font-semibold text-slate-900 font-display"
          >
            Visual Food Category Taxonomy
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Subtle Pokémon-type-inspired color accents organize detected meal items into five culinary groups.
          </p>
        </div>
        <p className="text-xs text-slate-500 max-w-md lg:text-right">
          Note: Category colors are for visual organization only and never infer calorie density or macro ratios.
        </p>
      </div>

      {/* Interactive Category Selector Tabs */}
      <div
        role="tablist"
        aria-label="Food Categories"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-5"
      >
        {ORDERED_CATEGORIES.map((categoryKey) => {
          const item = FOOD_CATEGORY_TAXONOMY[categoryKey];
          const isSelected = selectedCategory === categoryKey;

          return (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={isSelected}
              onClick={() => setSelectedCategory(item.id)}
              className={`flex flex-col justify-between text-left p-3.5 rounded-xl border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                isSelected
                  ? `${item.surfaceClass} ${item.borderClass}`
                  : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <span
                  className={`text-xs font-semibold tracking-tight whitespace-nowrap shrink-0 ${
                    isSelected ? item.textClass : 'text-slate-700'
                  }`}
                >
                  {item.typeInspiration}
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-sm shrink-0 ${item.swatchClass}`}
                  aria-hidden="true"
                />
              </div>
              <span className="text-sm font-semibold text-slate-900 mt-2 whitespace-nowrap truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Category Details Bar */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-semibold ${activeTaxonomy.textClass}`}>
            {activeTaxonomy.label} ({activeTaxonomy.typeInspiration})
          </span>
          <span aria-hidden="true">·</span>
          <span>{activeTaxonomy.description}</span>
        </div>
        <div className="text-slate-500 shrink-0">
          <span>Examples: {activeTaxonomy.examples}</span>
        </div>
      </div>
    </section>
  );
};
