"use client";

import {
  BookOpenIcon,
  LightBulbIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";

interface ContextualAsideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContextualAside({ isOpen, onClose }: ContextualAsideProps) {
  const resources = [
    {
      title: "LangSmith",
      description:
        "LangChain's comprehensive evaluation platform for LLM applications",
      url: "https://smith.langchain.com/",
      type: "Platform",
    },
    {
      title: "promptfoo",
      description: "Open-source prompt testing and evaluation framework",
      url: "https://www.promptfoo.dev/",
      type: "Framework",
    },
    {
      title: "Weights & Biases",
      description: "ML experiment tracking with LLM evaluation capabilities",
      url: "https://wandb.ai/",
      type: "Platform",
    },
    {
      title: "Humanloop",
      description: "Platform for building and evaluating LLM applications",
      url: "https://humanloop.com/",
      type: "Platform",
    },
    {
      title: "OpenAI Evals",
      description: "OpenAI's framework for evaluating LLM performance",
      url: "https://github.com/openai/evals",
      type: "Framework",
    },
  ];

  const keyConcepts = [
    {
      concept: "Evaluation Metrics",
      explanation:
        "Quantitative measures used to assess model performance, such as accuracy, BLEU score, or custom metrics.",
    },
    {
      concept: "Ground Truth",
      explanation:
        "The correct or expected output that serves as a reference for evaluating model predictions.",
    },
    {
      concept: "A/B Testing",
      explanation:
        "Comparing two or more model versions to determine which performs better on specific metrics.",
    },
    {
      concept: "Human Evaluation",
      explanation:
        "Direct assessment of model outputs by human evaluators for subjective quality measures.",
    },
    {
      concept: "Evaluation Pipeline",
      explanation:
        "Automated system for running evaluations, collecting results, and generating reports.",
    },
  ];

  const practicalTips = [
    "Start with simple, well-defined evaluation metrics before adding complexity",
    "Use multiple complementary metrics to get a comprehensive view of performance",
    "Include edge cases and failure scenarios in your evaluation datasets",
    "Set up automated evaluation pipelines for continuous monitoring",
    "Regularly update evaluation criteria as your use case evolves",
    "Involve stakeholders in defining evaluation metrics and success criteria",
    "Document your evaluation methodology for reproducibility",
    "Use evaluation results to guide model improvements and iterations",
    "Monitor evaluation metrics in production to detect performance drift",
    "Consider both automated and human evaluation for comprehensive assessment",
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
            <h2 className="text-lg font-semibold text-white">
              Evaluation Resources
            </h2>
            <DrawerCloseButton onClose={onClose} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Resources */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <BookOpenIcon className="w-5 h-5 text-blue-400" />
                <h3 className="font-medium text-white">Evaluation Tools</h3>
              </div>
              <div className="space-y-3">
                {resources.map((resource, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2 py-1 bg-blue-600 text-xs rounded-full">
                        {resource.type}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm mb-1 text-white">
                      {resource.title}
                    </h4>
                    <p className="text-gray-300 text-xs mb-2">
                      {resource.description}
                    </p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center space-x-1"
                    >
                      <span>View Tool</span>
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Concepts */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <AcademicCapIcon className="w-5 h-5 text-green-400" />
                <h3 className="font-medium text-white">Key Concepts</h3>
              </div>
              <div className="space-y-3">
                {keyConcepts.map((concept, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-1 text-white">
                      {concept.concept}
                    </h4>
                    <p className="text-gray-300 text-xs">
                      {concept.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical Tips */}
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <LightBulbIcon className="w-5 h-5 text-yellow-400" />
                <h3 className="font-medium text-white">Practical Tips</h3>
              </div>
              <div className="space-y-2">
                {practicalTips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300 text-xs">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
