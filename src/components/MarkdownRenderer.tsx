import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-slate max-w-none", className)}>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-serif font-semibold mt-6 mb-4 text-slate-900" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-serif font-medium mt-5 mb-3 text-slate-800 border-b border-slate-200 pb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-medium mt-4 mb-2 text-slate-800" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-slate-700" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 mb-4 space-y-1 text-slate-700" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 mb-4 space-y-1 text-slate-700" {...props} />,
          li: ({ node, ...props }) => <li className="pl-1" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4" {...props} />
          ),
          code: ({ node, ...props }) => (
            <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
