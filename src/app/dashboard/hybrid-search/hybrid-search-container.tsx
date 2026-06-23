"use client";

import React, { useState } from "react";
import {
  MagnifyingGlassIcon,
  AcademicCapIcon,
  ChartBarIcon,
  BeakerIcon,
  LightBulbIcon,
  DocumentTextIcon,
  CogIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { scoreColorClass3 } from "@/components/shared/search-demo";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  searchType: "semantic" | "keyword" | "hybrid";
  keywords: string[];
  semanticScore: number;
  keywordScore: number;
}

interface SearchStrategy {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  icon: any;
}

export function HybridSearchContainer() {
  const [activeTab, setActiveTab] = useState("basics");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("hybrid");
  const [showResults, setShowResults] = useState(false);
  const [alpha, setAlpha] = useState(0.7); // Weight for hybrid search

  // Sample documents for search
  const documents = [
    {
      id: "1",
      title: "Machine Learning Fundamentals",
      content:
        "Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions without explicit programming. It uses algorithms to identify patterns in data and make predictions.",
      keywords: [
        "machine learning",
        "artificial intelligence",
        "algorithms",
        "predictions",
        "data",
      ],
    },
    {
      id: "2",
      title: "Deep Learning Neural Networks",
      content:
        "Deep learning involves neural networks with multiple layers that can automatically learn hierarchical representations of data. These networks excel at tasks like image recognition and natural language processing.",
      keywords: [
        "deep learning",
        "neural networks",
        "layers",
        "image recognition",
        "natural language processing",
      ],
    },
    {
      id: "3",
      title: "Natural Language Processing Techniques",
      content:
        "NLP combines computational linguistics with machine learning to help computers understand, interpret, and generate human language. It powers applications like chatbots and translation services.",
      keywords: [
        "natural language processing",
        "computational linguistics",
        "chatbots",
        "translation",
        "human language",
      ],
    },
    {
      id: "4",
      title: "Computer Vision Applications",
      content:
        "Computer vision enables machines to interpret and understand visual information from the world. It's used in autonomous vehicles, medical imaging, and facial recognition systems.",
      keywords: [
        "computer vision",
        "visual information",
        "autonomous vehicles",
        "medical imaging",
        "facial recognition",
      ],
    },
    {
      id: "5",
      title: "Data Science and Analytics",
      content:
        "Data science combines statistics, programming, and domain expertise to extract insights from data. It involves data cleaning, exploration, modeling, and visualization.",
      keywords: [
        "data science",
        "statistics",
        "programming",
        "insights",
        "modeling",
        "visualization",
      ],
    },
  ];

  // Search strategies
  const searchStrategies: SearchStrategy[] = [
    {
      id: "semantic",
      name: "Semantic Search",
      description:
        "Uses vector embeddings to find conceptually similar content regardless of exact keyword matches.",
      pros: [
        "Understands context and meaning",
        "Handles synonyms and related concepts",
        "Good for complex queries",
      ],
      cons: [
        "May miss exact keyword matches",
        "Requires good embeddings",
        "Computationally expensive",
      ],
      icon: SparklesIcon,
    },
    {
      id: "keyword",
      name: "Keyword Search",
      description:
        "Traditional search based on exact word matches and text frequency analysis.",
      pros: [
        "Fast and efficient",
        "Precise for exact matches",
        "Simple to implement",
      ],
      cons: [
        "Misses semantic relationships",
        "Poor with synonyms",
        "Limited context understanding",
      ],
      icon: DocumentTextIcon,
    },
    {
      id: "hybrid",
      name: "Hybrid Search",
      description:
        "Combines semantic and keyword search for optimal results using weighted scoring.",
      pros: [
        "Best of both worlds",
        "High accuracy and recall",
        "Flexible weighting",
      ],
      cons: [
        "More complex implementation",
        "Requires tuning parameters",
        "Higher computational cost",
      ],
      icon: CogIcon,
    },
  ];

  // Simulate search results
  const performSearch = (query: string, strategy: string): SearchResult[] => {
    if (!query.trim()) return [];

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    return documents
      .map((doc) => {
        const docLower = doc.content.toLowerCase();
        const titleLower = doc.title.toLowerCase();

        // Keyword scoring
        const keywordMatches = queryWords.filter(
          (word) =>
            docLower.includes(word) ||
            titleLower.includes(word) ||
            doc.keywords.some((keyword) => keyword.toLowerCase().includes(word))
        ).length;
        const keywordScore = keywordMatches / queryWords.length;

        // Semantic scoring (simulated)
        const semanticScore = Math.random() * 0.8 + 0.2; // Simulated semantic similarity

        // Hybrid scoring
        const hybridScore = alpha * semanticScore + (1 - alpha) * keywordScore;

        return {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          score:
            strategy === "semantic"
              ? semanticScore
              : strategy === "keyword"
              ? keywordScore
              : hybridScore,
          searchType: strategy as "semantic" | "keyword" | "hybrid",
          keywords: doc.keywords,
          semanticScore,
          keywordScore,
        };
      })
      .filter((result) => result.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowResults(true);
    }
  };

  const searchResults = showResults
    ? performSearch(searchQuery, selectedStrategy)
    : [];

  // Function to get color based on score percentage
  const getScoreColor = scoreColorClass3;

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Hybrid Search: Multi-Strategy Retrieval
        </h1>
        <p className="text-gray-400 text-lg max-w-3xl mx-auto">
          Explore how combining semantic and keyword search strategies creates
          more powerful and accurate information retrieval systems
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap justify-center mb-8">
        {[
          { id: "basics", name: "Basics", icon: AcademicCapIcon },
          { id: "strategies", name: "Search Strategies", icon: ChartBarIcon },
          { id: "demo", name: "Interactive Demo", icon: BeakerIcon },
          {
            id: "comparison",
            name: "Strategy Comparison",
            icon: LightBulbIcon,
          },
        ].map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`flex items-center space-x-2 px-4 py-2 mx-2 mb-2 rounded-lg transition-colors ${
                activeTab === section.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{section.name}</span>
            </button>
          );
        })}
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {/* Basics Section */}
        {activeTab === "basics" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">
                What is Hybrid Search?
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Hybrid Search combines multiple search strategies to provide
                more comprehensive and accurate results. By leveraging both
                semantic understanding and traditional keyword matching, it
                overcomes the limitations of single-strategy approaches.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Traditional Search Limitations
                  </h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Keyword search misses semantic relationships</li>
                    <li>• Semantic search may ignore exact matches</li>
                    <li>• Single strategy bias</li>
                    <li>• Limited context understanding</li>
                  </ul>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Hybrid Search Benefits
                  </h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Combines multiple search strategies</li>
                    <li>• Higher accuracy and recall</li>
                    <li>• Flexible weighting system</li>
                    <li>• Better user experience</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/30 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">
                How Hybrid Search Works
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-gray-800/50 rounded-lg p-6 mb-4">
                    <DocumentTextIcon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      1. Query Processing
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Analyze the query using both semantic and keyword
                      approaches
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-gray-800/50 rounded-lg p-6 mb-4">
                    <CogIcon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      2. Multi-Strategy Search
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Execute semantic and keyword searches in parallel
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-gray-800/50 rounded-lg p-6 mb-4">
                    <SparklesIcon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      3. Result Fusion
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Combine and rank results using weighted scoring
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Strategies Section */}
        {activeTab === "strategies" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/30 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Search Strategies Comparison
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {searchStrategies.map((strategy) => {
                  const Icon = strategy.icon;
                  return (
                    <div
                      key={strategy.id}
                      className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
                    >
                      <div className="flex items-center mb-4">
                        <Icon className="w-8 h-8 text-blue-400 mr-3" />
                        <h3 className="text-lg font-semibold text-white">
                          {strategy.name}
                        </h3>
                      </div>
                      <p className="text-gray-300 text-sm mb-4">
                        {strategy.description}
                      </p>

                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-white mb-2">
                          Pros:
                        </h4>
                        <ul className="space-y-1 text-xs text-gray-300">
                          {strategy.pros.map((pro, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-400 mr-2">•</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-red-400 mb-2">
                          Cons:
                        </h4>
                        <ul className="space-y-1 text-xs text-gray-300">
                          {strategy.cons.map((con, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-red-400 mr-2">•</span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Demo Section */}
        {activeTab === "demo" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-700/30 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Interactive Hybrid Search Demo
              </h2>

              {/* Search Controls */}
              <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Search Query
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Enter your search query..."
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      />
                      <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg transition-colors"
                      >
                        <MagnifyingGlassIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Search Strategy
                    </label>
                    <select
                      value={selectedStrategy}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="semantic">Semantic Search</option>
                      <option value="keyword">Keyword Search</option>
                      <option value="hybrid">Hybrid Search</option>
                    </select>
                  </div>
                </div>

                {selectedStrategy === "hybrid" && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Semantic Weight (α): {alpha.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={alpha}
                      onChange={(e) => setAlpha(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Keyword Focus</span>
                      <span>Semantic Focus</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {showResults && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Search Results ({searchResults.length} found)
                  </h3>

                  {searchResults.map((result, index) => (
                    <div
                      key={result.id}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-white">
                          {result.title}
                        </h4>
                        <div className="text-right">
                          <div
                            className={`text-sm ${getScoreColor(
                              result.score * 100
                            )}`}
                          >
                            Score: {(result.score * 100).toFixed(1)}%
                          </div>
                          {selectedStrategy === "hybrid" && (
                            <div className="text-xs text-gray-400">
                              S:{" "}
                              <span
                                className={getScoreColor(
                                  result.semanticScore * 100
                                )}
                              >
                                {(result.semanticScore * 100).toFixed(0)}%
                              </span>{" "}
                              | K:{" "}
                              <span
                                className={getScoreColor(
                                  result.keywordScore * 100
                                )}
                              >
                                {(result.keywordScore * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        {result.content}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sample Queries */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Try These Sample Queries:
                </h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {[
                    "machine learning algorithms",
                    "neural networks",
                    "natural language processing",
                    "computer vision",
                    "data science",
                    "artificial intelligence",
                  ].map((query) => (
                    <button
                      key={query}
                      onClick={() => {
                        setSearchQuery(query);
                        setShowResults(false);
                      }}
                      className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Comparison Section */}
        {activeTab === "comparison" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-700/30 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Strategy Performance Comparison
              </h2>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Semantic Search
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-base">
                        Accuracy:
                      </span>
                      <span
                        className="!text-green-300 font-bold text-xl"
                        style={{ color: "#86efac" }}
                      >
                        85%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-base">
                        Recall:
                      </span>
                      <span
                        className="!text-yellow-400 font-bold text-xl"
                        style={{ color: "#facc15" }}
                      >
                        78%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-base">
                        Speed:
                      </span>
                      <span className="text-white font-bold text-lg">
                        Medium
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Keyword Search
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-base">
                        Accuracy:
                      </span>
                      <span
                        className="!text-yellow-400 font-bold text-xl"
                        style={{ color: "#facc15" }}
                      >
                        72%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-base">
                        Recall:
                      </span>
                      <span
                        className="!text-orange-400 font-bold text-xl"
                        style={{ color: "#fb923c" }}
                      >
                        65%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-base">
                        Speed:
                      </span>
                      <span className="text-white font-bold text-lg">Fast</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-500">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Hybrid Search
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-base">
                        Accuracy:
                      </span>
                      <span
                        className="!text-green-400 font-bold text-xl"
                        style={{ color: "#4ade80" }}
                      >
                        92%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-base">
                        Recall:
                      </span>
                      <span
                        className="!text-green-400 font-bold text-xl"
                        style={{ color: "#4ade80" }}
                      >
                        88%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-base">
                        Speed:
                      </span>
                      <span className="text-white font-bold text-lg">
                        Medium
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-6">
                  When to Use Each Strategy
                </h3>
                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4">
                      Semantic Search
                    </h4>
                    <ul className="text-white space-y-3">
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-3 font-bold text-lg">
                          •
                        </span>
                        <span className="font-medium">
                          Complex, conceptual queries
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-3 font-bold text-lg">
                          •
                        </span>
                        <span className="font-medium">
                          When synonyms matter
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-3 font-bold text-lg">
                          •
                        </span>
                        <span className="font-medium">
                          Content recommendation
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-400 mr-3 font-bold text-lg">
                          •
                        </span>
                        <span className="font-medium">
                          Research and discovery
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4">
                      Keyword Search
                    </h4>
                    <ul className="text-white space-y-3">
                      <li className="flex items-start">
                        <span className="text-green-400 mr-3 font-bold text-lg">
                          •
                        </span>
                        <span className="font-medium">Exact term matching</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-400 mr-3 font-bold text-lg">
                          •
                        </span>
                        <span className="font-medium">
                          Fast, simple queries
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-400 mr-3 font-bold text-lg">
                          •
                        </span>
                        <span className="font-medium">
                          Technical documentation
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-400 mr-3 font-bold text-lg">
                          •
                        </span>
                        <span className="font-medium">
                          When speed is critical
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4">
                      Hybrid Search
                    </h4>
                    <ul className="text-white space-y-3">
                      <li className="flex items-start">
                        <span className="text-purple-400 mr-3 font-bold text-lg">
                          •
                        </span>
                        <span className="font-medium">
                          General-purpose search
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-purple-400 mr-3 font-bold text-lg">
                          •
                        </span>
                        <span className="font-medium">Mixed query types</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-purple-400 mr-3 font-bold text-lg">
                          •
                        </span>
                        <span className="font-medium">
                          High-accuracy requirements
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-purple-400 mr-3 font-bold text-lg">
                          •
                        </span>
                        <span className="font-medium">Production systems</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
