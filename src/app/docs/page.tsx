import type { Metadata } from "next";
import { ApiDocsClient } from "./ApiDocsClient";

export const metadata: Metadata = {
  title: "Kalygo – API Documentation",
  description: "Interactive API documentation for the Kalygo3 platform",
};

export default function DocsPage() {
  return <ApiDocsClient />;
}
