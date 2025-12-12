"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  AcademicCapIcon,
  BoltIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ChartBarIcon,
  CodeBracketIcon,
  RocketLaunchIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import { TbPlayFootball } from "react-icons/tb";

// Social Media Icons
const InstagramIcon = () => (
  <svg
    className="w-6 h-6 text-pink-400"
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
      clipRule="evenodd"
    />
  </svg>
);

const YouTubeIcon = () => (
  <svg
    className="w-6 h-6 text-red-400"
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
      clipRule="evenodd"
    />
  </svg>
);

const LinkedInIcon = () => (
  <svg
    className="w-6 h-6 text-blue-400"
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
      clipRule="evenodd"
    />
  </svg>
);

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">K</span>
          </div>
          <span className="text-2xl font-bold text-white">Kalygo</span>
        </div>
        <div className="flex items-center space-x-6">
          <Link
            href="/login"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all hover:scale-105 shadow-lg hover:shadow-blue-500/50"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
            <TbPlayFootball className="w-5 h-5" style={{ stroke: "#60a5fa" }} />
            <span className="text-blue-400 text-sm font-medium">
              Welcome to the playground
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Master
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Open Source Software
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Interact with real-world applications through our battle-tested
            platform. Experience not theory.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
            <Link
              href="/signup"
              className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-xl hover:shadow-blue-500/50 flex items-center space-x-2"
            >
              <span>Start for Free</span>
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold text-lg transition-all border border-gray-700 hover:border-gray-600"
            >
              Sign In
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all hover:scale-105">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <BoltIcon className="w-6 h-6" style={{ stroke: "#60a5fa" }} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Learn</h3>
              <p className="text-gray-400">Accelerate your journey.</p>
            </div>

            <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-all hover:scale-105">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <AcademicCapIcon
                  className="w-6 h-6"
                  style={{ stroke: "#a78bfa" }}
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Progress
              </h3>
              <p className="text-gray-400">From basics to Advanced.</p>
            </div>

            <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-green-500/50 transition-all hover:scale-105">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheckIcon
                  className="w-6 h-6"
                  style={{ stroke: "#4ade80" }}
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Production Ready
              </h3>
              <p className="text-gray-400">Solve real-world problems.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Kalygo is an experiential platform designed for do-ers where you
              learn advanced open source software skills and techniques by
              implementing real-world applications.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gray-800/30 rounded-xl border border-gray-700/30">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CodeBracketIcon
                  className="w-8 h-8"
                  style={{ stroke: "#60a5fa" }}
                />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                1. Explore
              </h3>
              <p className="text-gray-400">
                Browse the Kalygo playground to see what you can build and how
                to build it.
              </p>
            </div>

            <div className="text-center p-8 bg-gray-800/30 rounded-xl border border-gray-700/30">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <SparklesIcon
                  className="w-8 h-8"
                  style={{ stroke: "#a78bfa" }}
                />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                2. Experiment
              </h3>
              <p className="text-gray-400">
                Hands-on experimentation with real-world tools and frameworks in
                a safe, controlled environment.
              </p>
            </div>

            <div className="text-center p-8 bg-gray-800/30 rounded-xl border border-gray-700/30">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <RocketLaunchIcon
                  className="w-8 h-8"
                  style={{ stroke: "#4ade80" }}
                />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                3. Master
              </h3>
              <p className="text-gray-400">
                Build confidence and expertise through practical experience with
                production-ready applications.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What You Can Build
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Explore powerful capabilities and build amazing applications
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-700/30 hover:border-blue-500/50 transition-all">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <SparklesIcon
                    className="w-6 h-6"
                    style={{ stroke: "#60a5fa" }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    AI & Machine Learning
                  </h3>
                  <p className="text-gray-400">
                    Build intelligent applications with embeddings, RAG systems,
                    and agentic workflows.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-700/30 hover:border-purple-500/50 transition-all">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MagnifyingGlassIcon
                    className="w-6 h-6"
                    style={{ stroke: "#a78bfa" }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Vector Search & Retrieval
                  </h3>
                  <p className="text-gray-400">
                    Implement semantic search, hybrid search, and advanced
                    reranking techniques.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gradient-to-br from-green-900/20 to-blue-900/20 rounded-xl border border-green-700/30 hover:border-green-500/50 transition-all">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CodeBracketIcon
                    className="w-6 h-6"
                    style={{ stroke: "#4ade80" }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Custom Tools & Integrations
                  </h3>
                  <p className="text-gray-400">
                    Extend functionality with custom tools and integrate with
                    external APIs and services.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gradient-to-br from-pink-900/20 to-orange-900/20 rounded-xl border border-pink-700/30 hover:border-pink-500/50 transition-all">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon
                    className="w-6 h-6"
                    style={{ stroke: "#f472b6" }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Production-Ready Systems
                  </h3>
                  <p className="text-gray-400">
                    Deploy scalable, secure applications with authentication,
                    payment processing, and more.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Join Our Community
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Follow us on social media for updates, tutorials, and community
            highlights
          </p>

          <div className="flex items-center justify-center space-x-8">
            <a
              href="https://www.instagram.com/kalygo.io"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-gray-800/50 hover:bg-gradient-to-br hover:from-pink-500/20 hover:to-purple-500/20 rounded-xl border border-gray-700/50 hover:border-pink-500/50 transition-all hover:scale-110 flex items-center justify-center"
              aria-label="Instagram"
            >
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg border border-pink-500/30 flex items-center justify-center">
                <InstagramIcon />
              </div>
            </a>
            <a
              href="https://www.youtube.com/@kalygo"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-gray-800/50 hover:bg-gradient-to-br hover:from-red-500/20 hover:to-pink-500/20 rounded-xl border border-gray-700/50 hover:border-red-500/50 transition-all hover:scale-110 flex items-center justify-center"
              aria-label="YouTube"
            >
              <div className="w-12 h-12 bg-red-500/20 rounded-lg border border-red-500/30 flex items-center justify-center">
                <YouTubeIcon />
              </div>
            </a>
            <a
              href="https://www.linkedin.com/company/93095976"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-gray-800/50 hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-cyan-500/20 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all hover:scale-110 flex items-center justify-center"
              aria-label="LinkedIn"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg border border-blue-500/30 flex items-center justify-center">
                <LinkedInIcon />
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl border border-blue-500/30">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the Kalygo community to get started.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-xl hover:shadow-blue-500/50"
            >
              <span>Start Living Today</span>
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">K</span>
                </div>
                <span className="text-2xl font-bold text-white">Kalygo</span>
              </div>
              <p className="text-gray-400 text-sm">
                Master open source software through hands-on implementation.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <div className="flex flex-col space-y-2">
                <Link
                  href="/login"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/kalygo.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  aria-label="Instagram"
                >
                  <div className="w-10 h-10 bg-pink-500/20 rounded-lg border border-pink-500/30 flex items-center justify-center">
                    <InstagramIcon />
                  </div>
                </a>
                <a
                  href="https://www.youtube.com/@kalygo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  aria-label="YouTube"
                >
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg border border-red-500/30 flex items-center justify-center">
                    <YouTubeIcon />
                  </div>
                </a>
                <a
                  href="https://www.linkedin.com/company/93095976"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  aria-label="LinkedIn"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg border border-blue-500/30 flex items-center justify-center">
                    <LinkedInIcon />
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2025 Kalygo. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="https://www.instagram.com/kalygo.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-400 text-sm transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://www.youtube.com/@kalygo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-400 text-sm transition-colors"
              >
                YouTube
              </a>
              <a
                href="https://www.linkedin.com/company/93095976"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
