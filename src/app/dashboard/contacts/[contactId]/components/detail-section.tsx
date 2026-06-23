"use client";

import type { ReactNode } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

/**
 * Presentational wrapper for the repeated section-card chrome on the contact
 * detail page: a header row with a title and an "add" action button, followed
 * by the section content (list or empty state) rendered as children.
 */
export function DetailSection({
  title,
  addLabel,
  onAdd,
  extraActions,
  children,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  /** Optional extra controls rendered to the left of the add button. */
  extraActions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {extraActions ? (
          <div className="flex items-center gap-2">
            {extraActions}
            <AddButton label={addLabel} onClick={onAdd} />
          </div>
        ) : (
          <AddButton label={addLabel} onClick={onAdd} />
        )}
      </div>
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm"
    >
      <PlusIcon className="h-4 w-4" />
      {label}
    </button>
  );
}
