import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import MermaidChart from "./MermaidChart";

const MarkdownRenderer = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) return null;

  return (
    <div className="markdown-content" style={{ overflowX: 'auto', width: '100%' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "text";
            const codeText = String(children).replace(/\n$/, "");

            if (!inline && language === "mermaid") {
              return <MermaidChart code={codeText} />;
            }

            if (!inline && match) {
              const codeId = codeText.substring(0, 20); // Simple ID for copied state
              return (
                <div style={{ position: "relative", margin: "12px 0", borderRadius: "8px", overflow: "hidden" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#1e1e1e",
                      padding: "6px 12px",
                      borderBottom: "1px solid #333",
                      fontSize: "0.75rem",
                      color: "#9cdcfe",
                    }}
                  >
                    <span>{language}</span>
                    <button
                      onClick={() => copyToClipboard(codeText, codeId)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#d4d4d4",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                      }}
                    >
                      {copiedIndex === codeId ? "✓ Copied" : "📋 Copy Code"}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    {...props}
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                  >
                    {codeText}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return (
              <code {...props} className={className} style={{ backgroundColor: 'var(--code-bg, #f4f3ec)', padding: '2px 4px', borderRadius: '4px', fontFamily: 'monospace' }}>
                {children}
              </code>
            );
          },
          table({ node, ...props }) {
            return (
              <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                <table {...props} style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid var(--border, #e5e4e7)' }} />
              </div>
            );
          },
          th({ node, ...props }) {
            return <th {...props} style={{ border: '1px solid var(--border, #e5e4e7)', padding: '8px', backgroundColor: 'var(--social-bg, #f9f9f9)', textAlign: 'left' }} />;
          },
          td({ node, ...props }) {
            return <td {...props} style={{ border: '1px solid var(--border, #e5e4e7)', padding: '8px' }} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
