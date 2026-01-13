"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { KnowledgeBase } from "@/services/agentsService";

interface KnowledgeBaseChipProps {
  knowledgeBase: KnowledgeBase;
  onRemove: () => void;
}

export function KnowledgeBaseChip({ knowledgeBase, onRemove }: KnowledgeBaseChipProps) {
  const getDisplayText = () => {
    if (knowledgeBase.provider === "pinecone") {
      const parts = [knowledgeBase.provider];
      if (knowledgeBase.index) parts.push(knowledgeBase.index);
      if (knowledgeBase.namespace) parts.push(knowledgeBase.namespace);
      return parts.join(" / ");
    }
    return knowledgeBase.provider;
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 rounded-lg text-sm text-blue-200">
      <span>{getDisplayText()}</span>
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-blue-500/30 rounded p-0.5 transition-colors"
        aria-label="Remove knowledge base"
      >
        <XMarkIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
