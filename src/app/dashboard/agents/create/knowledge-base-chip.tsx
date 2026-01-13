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
      const parts: string[] = [];
      if (knowledgeBase.index) parts.push(knowledgeBase.index);
      if (knowledgeBase.namespace) parts.push(knowledgeBase.namespace);
      // If we have index or namespace, show them; otherwise show provider
      return parts.length > 0 ? parts.join(" / ") : "pinecone";
    }
    return knowledgeBase.provider;
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 rounded-full text-sm text-blue-200 hover:bg-blue-600/30 transition-colors">
      <span className="font-medium">{getDisplayText()}</span>
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-blue-500/40 rounded-full p-0.5 transition-colors flex-shrink-0"
        aria-label="Remove knowledge base"
      >
        <XMarkIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
