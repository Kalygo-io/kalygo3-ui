"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Cog6ToothIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

export interface SettingsDropdownProps {
  /** Knob controls (sliders, etc.) rendered inside the popover. */
  children: React.ReactNode;
  /** Called when the user clicks "Apply Settings". The popover then closes. */
  onApply: () => void;
  /** Click handler for the info (i) button rendered next to the gear. */
  onInfoClick: () => void;
  /** Popover title. */
  title?: string;
  /** Apply button label. */
  applyLabel?: string;
  /**
   * z-index of the fixed top-right button group. reranking used z-50,
   * similarity-search used z-10.
   */
  containerZ?: string;
}

/**
 * Shared settings popover for the ML search demo pages. Renders the fixed
 * top-right gear + info button group, handles click-outside-to-close, and
 * exposes the per-page knobs via `children` plus an Apply action.
 */
export function SettingsDropdown({
  children,
  onApply,
  onInfoClick,
  title = "Search Settings",
  applyLabel = "Apply Settings",
  containerZ = "z-50",
}: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`fixed top-20 right-4 ${containerZ} flex items-center space-x-2`}
    >
      {/* Settings Button */}
      <div className="relative" ref={settingsRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors text-white shadow-lg"
        >
          <Cog6ToothIcon className="w-4 h-4 text-blue-400" />
        </button>

        {/* Settings Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>

              <div className="space-y-4">
                {children}

                <button
                  onClick={() => {
                    onApply();
                    setIsOpen(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {applyLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Button */}
      <button
        onClick={onInfoClick}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors text-white shadow-lg"
      >
        <InformationCircleIcon className="w-4 h-4 text-blue-400" />
      </button>
    </div>
  );
}
