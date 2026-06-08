import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/shared/utils";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  const safeContent = typeof content === "string" ? content : "";

  return (
    <ReactMarkdown
      className={cn("chat-markdown", className)}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // Paragraphs - clean, readable text
        p({ children, ...props }) {
          return (
            <p className="text-gray-100 leading-relaxed mb-4 last:mb-0">
              {children}
            </p>
          );
        },

        // Headings - clear hierarchy
        h1({ children, ...props }) {
          return (
            <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0">
              {children}
            </h1>
          );
        },
        h2({ children, ...props }) {
          return (
            <h2 className="text-xl font-semibold text-white mb-3 mt-5 first:mt-0">
              {children}
            </h2>
          );
        },
        h3({ children, ...props }) {
          return (
            <h3 className="text-lg font-medium text-white mb-3 mt-4 first:mt-0">
              {children}
            </h3>
          );
        },
        h4({ children, ...props }) {
          return (
            <h4 className="text-base font-medium text-white mb-2 mt-3 first:mt-0">
              {children}
            </h4>
          );
        },
        h5({ children, ...props }) {
          return (
            <h5 className="text-sm font-medium text-white mb-2 mt-3 first:mt-0">
              {children}
            </h5>
          );
        },
        h6({ children, ...props }) {
          return (
            <h6 className="text-xs font-medium text-white mb-2 mt-3 first:mt-0">
              {children}
            </h6>
          );
        },

        // Lists - clean, consistent spacing
        ul({ children, ...props }) {
          return (
            <ul className="text-gray-100 leading-relaxed mb-4 ml-6 space-y-2">
              {children}
            </ul>
          );
        },
        ol({ children, ...props }) {
          return (
            <ol className="text-gray-100 leading-relaxed mb-4 ml-6 space-y-2">
              {children}
            </ol>
          );
        },
        li({ children, ...props }) {
          return <li className="text-gray-100 leading-relaxed">{children}</li>;
        },

        // Code blocks - professional syntax highlighting
        code({ className, children, ...props }) {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-gray-800/60 px-1.5 py-0.5 rounded text-sm font-mono text-blue-300 border border-gray-700/50">
                {children}
              </code>
            );
          }
          return (
            <code className="bg-gray-800/60 px-1.5 py-0.5 rounded text-sm font-mono text-blue-300 border border-gray-700/50">
              {children}
            </code>
          );
        },
        pre({ children, ...props }) {
          return (
            <pre className="bg-gray-900/80 border border-gray-700/50 rounded-lg p-4 mb-4 overflow-x-auto">
              {children}
            </pre>
          );
        },

        // Blockquotes - elegant styling
        blockquote({ children, ...props }) {
          return (
            <blockquote className="border-l-4 border-blue-500/50 pl-4 py-2 mb-4 bg-blue-500/5 rounded-r-lg">
              <div className="text-gray-200 italic leading-relaxed">
                {children}
              </div>
            </blockquote>
          );
        },

        // Links - clear, accessible
        a({ href, children, ...props }) {
          return (
            <a
              href={href}
              className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/50 hover:decoration-blue-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },

        // Tables - beautiful styling
        table({ children, ...props }) {
          return (
            <div className="overflow-x-auto mb-6 rounded-lg border border-gray-700/50 bg-gray-900/30 shadow-lg">
              <table className="min-w-full">{children}</table>
            </div>
          );
        },
        thead({ children, ...props }) {
          return (
            <thead className="bg-gray-800/70 border-b border-gray-700/50">
              {children}
            </thead>
          );
        },
        tbody({ children, ...props }) {
          return (
            <tbody className="divide-y divide-gray-700/30">{children}</tbody>
          );
        },
        tr({ children, ...props }) {
          return (
            <tr className="hover:bg-gray-800/40 transition-colors duration-150">
              {children}
            </tr>
          );
        },
        th({ children, ...props }) {
          return (
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-50">
              {children}
            </th>
          );
        },
        td({ children, ...props }) {
          return (
            <td className="px-4 py-2.5 text-sm text-gray-200 leading-relaxed">
              {children}
            </td>
          );
        },

        // Horizontal rules
        hr({ ...props }) {
          return <hr className="border-gray-700/50 my-6" />;
        },

        // Strong and emphasis
        strong({ children, ...props }) {
          return (
            <strong className="font-semibold text-white">{children}</strong>
          );
        },
        em({ children, ...props }) {
          return <em className="italic text-gray-200">{children}</em>;
        },
      }}
    >
      {safeContent}
    </ReactMarkdown>
  );
}
