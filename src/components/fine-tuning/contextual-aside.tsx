"use client";

import {
  BookOpenIcon,
  LightBulbIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { DrawerCloseButton } from "@/components/shared/drawer-close-button";

interface ContextualAsideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContextualAside({ isOpen, onClose }: ContextualAsideProps) {
  const resources = [
    {
      title: "NVIDIA NeMo Embedding Models Guide",
      description:
        "Comprehensive guide to fine-tuning embedding models with NeMo framework",
      url: "https://docs.nvidia.com/nemo-framework/user-guide/latest/embeddingmodels/index.html",
      type: "Documentation",
    },
    {
      title: "NeMo BERT/SBERT Fine-tuning",
      description:
        "Specific guide for fine-tuning BERT and Sentence-BERT models",
      url: "https://docs.nvidia.com/nemo-framework/user-guide/latest/embeddingmodels/bert/sbert.html",
      type: "Tutorial",
    },
    {
      title: "Hugging Face Sentence Transformers Training",
      description:
        "Complete guide to training sentence transformers with Hugging Face",
      url: "https://huggingface.co/blog/train-sentence-transformers",
      type: "Tutorial",
    },
    {
      title: "Sentence Transformers Documentation",
      description:
        "Official documentation for the sentence-transformers library",
      url: "https://www.sbert.net/",
      type: "Documentation",
    },
    {
      title: "Fine-tuning BERT for Text Classification",
      description: "Research paper on fine-tuning BERT models",
      url: "https://arxiv.org/abs/1905.05583",
      type: "Research Paper",
    },
  ];

  const keyConcepts = [
    {
      concept: "Transfer Learning",
      explanation:
        "Using knowledge from a pre-trained model and adapting it to a new task with limited data.",
    },
    {
      concept: "Learning Rate",
      explanation:
        "The step size at each iteration while moving toward a minimum of the loss function.",
    },
    {
      concept: "Overfitting",
      explanation:
        "When a model learns the training data too well, including noise, leading to poor generalization.",
    },
    {
      concept: "Validation Set",
      explanation:
        "A subset of data used to evaluate the model during training and prevent overfitting.",
    },
    {
      concept: "Domain Adaptation",
      explanation:
        "The process of adapting a model trained on one domain to perform well on a different domain.",
    },
  ];

  const practicalTips = [
    "Start with a small learning rate (1e-5) and gradually increase if needed",
    "Use a validation set to monitor training progress and prevent overfitting",
    "Implement early stopping to save the best model checkpoint",
    "Use data augmentation to increase your training dataset size",
    "Monitor both training and validation loss during training",
    "Consider using mixed precision training for faster training on GPUs",
    "Save model checkpoints regularly to resume training if needed",
    "Test your fine-tuned model on real-world data before deployment",
    "Compare performance against the base model to ensure improvement",
    "Use appropriate evaluation metrics for your specific use case",
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
              Fine-tuning Resources
            </h2>
            <DrawerCloseButton onClose={onClose} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Resources */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <BookOpenIcon className="w-5 h-5 text-blue-400" />
                <h3 className="font-medium text-white">Reference Guides</h3>
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
                      <span>View Resource</span>
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
