import React from 'react';
import { RotateCcw, Upload, Utensils } from 'lucide-react';
import { AnalysisStatus } from '../types/nutrition';

interface HeaderProps {
  analysisStatus: AnalysisStatus;
  hasActiveMeal: boolean;
  onTriggerFileSelect: () => void;
  onStartNewMeal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  analysisStatus,
  hasActiveMeal,
  onTriggerFileSelect,
  onStartNewMeal,
}) => {
  const statusLabel =
    analysisStatus === 'ANALYZING'
      ? 'Analyzing meal photo...'
      : analysisStatus === 'COMPLETED'
        ? 'Analysis complete'
        : analysisStatus === 'READY_TO_ANALYZE'
          ? 'Photo staged · Ready to scan'
          : 'Meal scanner ready';

  return (
    <header className="sticky top-0 z-20 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#E5E4DF]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3">
        {/* Zone 1: Brand lockup with food/nutrition icon and subtitle */}
        <a
          href="#top"
          className="inline-flex items-center gap-2.5 text-zinc-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 rounded-lg"
        >
          <span className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-2xs shrink-0">
            <Utensils className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="text-lg sm:text-xl font-bold tracking-tight font-display">
            HiperMeal
          </span>
          <span
            aria-hidden="true"
            className="hidden sm:inline text-zinc-300 font-normal"
          >
            /
          </span>
          <span className="hidden sm:inline text-xs font-medium text-zinc-600">
            AI Visual Nutrition Diary
          </span>
        </a>

        {/* Zone 2: Subtle scanner status & section links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-6 text-xs font-medium text-zinc-600"
        >
          <span
            data-testid="header-scanner-status"
            className="text-emerald-900 font-medium whitespace-nowrap shrink-0"
          >
            {statusLabel}
          </span>
          <span aria-hidden="true" className="text-zinc-300">
            ·
          </span>
          <a
            href="#upload-workspace"
            className="hover:text-zinc-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Meal Capture
          </a>
          <a
            href="#results-workspace"
            className="hover:text-zinc-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Nutrition Review
          </a>
          <a
            href="#category-taxonomy"
            className="hover:text-zinc-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Category Guide
          </a>
        </nav>

        {/* Zone 3: Single contextual primary action */}
        <div className="flex items-center shrink-0">
          {hasActiveMeal ? (
            <button
              type="button"
              onClick={onStartNewMeal}
              data-testid="header-start-new-meal-button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-emerald-950 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/80 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-800" aria-hidden="true" />
              <span>Start New Meal</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onTriggerFileSelect}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[38px] text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Choose Photo</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
