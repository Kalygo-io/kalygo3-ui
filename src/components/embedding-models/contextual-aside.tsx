"use client";

import {
  BookOpenIcon,
  LightBulbIcon,
  AcademicCapIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";

interface ContextualAsideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContextualAside({ isOpen, onClose }: ContextualAsideProps) {
  const resources = [
    {
      title: "Word2Vec Paper",
      description: "The original paper that introduced word embeddings",
      url: "https://arxiv.org/abs/1301.3781",
      type: "Research Paper",
    },
    {
      title: "BERT: Pre-training of Deep Bidirectional Transformers",
      description: "Foundational paper for modern embedding models",
      url: "https://arxiv.org/abs/1810.04805",
      type: "Research Paper",
    },
    {
      title: "Sentence Transformers Documentation",
      description: "Comprehensive guide to using sentence transformers",
      url: "https://www.sbert.net/",
      type: "Documentation",
    },
    {
      title: "OpenAI Embeddings Guide",
      description: "Official guide to OpenAI's embedding models",
      url: "https://platform.openai.com/docs/guides/embeddings",
      type: "Documentation",
    },
  ];

  const keyConcepts = [
    {
      concept: "Vector Space",
      explanation:
        "A mathematical space where each point represents a token (or sequence of tokens) as a vector of numbers.",
    },
    {
      concept: "Cosine Similarity",
      explanation:
        "A measure of similarity between two vectors based on the cosine of the angle between them.",
    },
    {
      concept: "Dimensionality",
      explanation:
        "The number of dimensions in an embedding vector (typically hundreds or thousands for modern models).",
    },
    {
      concept: "Semantic Meaning",
      explanation:
        "The meaning and context of data, captured through their relationships in vector space.",
    },
  ];

  const practicalTips = [
    "Choose the right model for your use case - consider speed vs. accuracy trade-offs",
    "Normalize your vectors before similarity calculations for better results",
    "Use appropriate distance metrics (cosine similarity for embeddings, Euclidean for coordinates)",
    "Consider dimensionality reduction for visualization (t-SNE, UMAP)",
    "Cache embeddings for frequently accessed content to improve performance",
    "Monitor embedding quality with semantic similarity benchmarks",
    "Use batch processing for large-scale embedding generation",
    "Consider fine-tuning embeddings for domain-specific applications",
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-16 bottom-0 right-0 w-96 bg-gray-900 border-l border-gray-700 z-[70] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <BookOpenIcon className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">
                Embedding Models
              </h2>
            </div>
            <DrawerCloseButton onClose={onClose} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-8">
            {/* Key Concepts */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <AcademicCapIcon className="w-5 h-5 text-blue-400 mr-2" />
                Key Concepts
              </h3>
              <div className="space-y-3">
                {keyConcepts.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                  >
                    <h4 className="font-medium text-white text-sm mb-1">
                      {item.concept}
                    </h4>
                    <p className="text-xs text-gray-400">{item.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical Tips */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <LightBulbIcon className="w-5 h-5 text-yellow-400 mr-2" />
                Practical Tips
              </h3>
              <div className="space-y-2">
                {practicalTips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-300">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Resources */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-2" />
                Learning Resources
              </h3>
              <div className="space-y-3">
                {resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white text-sm">
                        {resource.title}
                      </h4>
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                        {resource.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {resource.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Next Steps
              </h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Explore vector databases (Pinecone, Weaviate)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Build a semantic search application</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
