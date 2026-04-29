"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import "./swagger-dark.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

const SPEC_URL = "/openapi/ai-api.json";

export function ApiDocsClient() {
  const [specAvailable, setSpecAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(SPEC_URL, { method: "HEAD" })
      .then((res) => setSpecAvailable(res.ok))
      .catch(() => setSpecAvailable(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <span className="text-xl font-bold text-white">Kalygo</span>
            <span className="text-gray-500 text-sm font-medium ml-2">
              API Docs
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            API Documentation
          </h1>
          <p className="text-gray-400">
            Interactive reference for the Kalygo API.
          </p>
        </div>

        {specAvailable === false ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
            <p className="text-gray-400 mb-2">No OpenAPI spec found.</p>
            <p className="text-gray-500 text-sm">
              Run{" "}
              <code className="bg-gray-800 px-2 py-0.5 rounded text-blue-400 text-xs">
                npm run export-openapi
              </code>{" "}
              with the AI API running to generate the spec.
            </p>
          </div>
        ) : specAvailable === null ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 mt-4">Loading...</p>
          </div>
        ) : (
          <div className="swagger-ui-wrapper rounded-xl border border-gray-800 overflow-hidden">
            <SwaggerUI url={SPEC_URL} />
          </div>
        )}
      </div>
    </div>
  );
}
