"use client";

import React from "react";
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Called when the user submits (Enter key or clicking the submit button). */
  onSubmit: () => void;
  placeholder?: string;
  /** Which icon to render inside the submit button. */
  submitIcon?: "magnifier" | "paper-airplane";
  /** Optional caption rendered under the input (left side). */
  caption?: React.ReactNode;
  /** Optional element rendered under the input (right side), e.g. a clear-cache button. */
  footerRight?: React.ReactNode;
  /**
   * Justify the footer row. similarity-search uses "between" (caption left,
   * action right); reranking centers caption + action together.
   */
  footerJustify?: "between" | "center";
  className?: string;
}

/**
 * Shared search input + submit button used by the ML search demo pages.
 * Submits on Enter (when the trimmed value is non-empty) and on button click.
 */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "What are you looking for?",
  submitIcon = "magnifier",
  caption,
  footerRight,
  footerJustify = "between",
  className = "w-full max-w-2xl mx-auto mb-6",
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onSubmit();
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            onClick={onSubmit}
            className={
              submitIcon === "paper-airplane"
                ? "p-1 text-gray-400 hover:text-gray-300 transition-colors"
                : "p-1 hover:bg-gray-700 rounded transition-colors"
            }
            title="Search"
          >
            {submitIcon === "paper-airplane" ? (
              <PaperAirplaneIcon className="h-5 w-5" />
            ) : (
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 hover:text-gray-300" />
            )}
          </button>
        </div>
      </div>

      {(caption || footerRight) && (
        <div
          className={`flex items-center mt-2 ${
            footerJustify === "center"
              ? "justify-center space-x-4"
              : "justify-between"
          }`}
        >
          {caption}
          {footerRight}
        </div>
      )}
    </div>
  );
}
