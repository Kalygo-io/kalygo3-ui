"use client";

import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

export function AppSettingsContainer() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <AdjustmentsHorizontalIcon className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">App Settings</h1>
          </div>
          <p className="text-gray-400">
            Configure application-level settings and preferences
          </p>
        </div>

        {/* Placeholder content */}
        <div className="space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              General
            </h2>
            <p className="text-gray-400 text-sm">
              No app settings are available yet. Settings will appear here as
              new features are added.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
