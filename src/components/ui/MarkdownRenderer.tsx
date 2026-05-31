'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          // 表格样式
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-border/50">{children}</td>
          ),
          // 代码块样式
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="bg-muted/60 text-foreground/90 px-1.5 py-0.5 rounded text-[13px] font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <div className="relative my-3 rounded-lg overflow-hidden border border-border">
              <pre className="bg-muted/30 p-4 overflow-x-auto text-sm leading-relaxed">
                {children}
              </pre>
            </div>
          ),
          // 标题样式
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-6 mb-3 pb-2 border-b border-border">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mt-5 mb-2 pb-1.5 border-b border-border/60">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mt-3 mb-1.5">{children}</h4>
          ),
          // 引用块
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 pl-4 py-1 my-3 bg-muted/30 rounded-r-lg text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          // 列表
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1 marker:text-primary/60">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1 marker:text-primary/60">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm leading-relaxed">{children}</li>
          ),
          // 水平线
          hr: () => <hr className="my-6 border-border" />,
          // 链接
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline underline-offset-2"
            >
              {children}
            </a>
          ),
          // 段落
          p: ({ children }) => (
            <p className="my-1.5 leading-relaxed">{children}</p>
          ),
          // 加粗
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          // 图片
          img: ({ src, alt }) => (
            <img src={src} alt={alt} className="max-w-full rounded-lg my-2" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
