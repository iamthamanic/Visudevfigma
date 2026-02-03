/**
 * CodePreview Component
 *
 * Renders React/JSX code in an isolated iframe
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Eye, Code2, AlertCircle, Copy, Check } from "lucide-react";
import styles from "./CodePreview.module.css";

interface CodePreviewProps {
  code: string;
  className?: string;
}

export function CodePreview({ code, className = "" }: CodePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    } catch {
      setCopied(false);
    }
  }, [code]);

  useEffect(() => {
    if (!code || viewMode !== "preview") return;

    try {
      // Extract JSX from component code
      const jsxContent = extractJSX(code);

      // Generate iframe HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 16px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            /* Reset common styles */
            button {
              cursor: pointer;
              border: none;
              background: none;
              font: inherit;
            }
            
            input, textarea, select {
              font: inherit;
            }
            
            /* Disable interactions for preview */
            button, a, input, textarea, select {
              pointer-events: none;
            }
          </style>
        </head>
        <body>
          ${jsxContent}
          
          <script>
            // Handle errors
            window.onerror = function(msg, url, line, col, error) {
              console.error('Preview error:', msg);
              return true;
            };
          </script>
        </body>
        </html>
      `;

      // Update iframe
      if (iframeRef.current) {
        const iframeDoc = iframeRef.current.contentDocument;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(html);
          iframeDoc.close();
        }
      }

      setError(null);
    } catch (err) {
      console.error("[CodePreview] Error rendering preview:", err);
      setError(err instanceof Error ? err.message : "Failed to render preview");
    }
  }, [code, viewMode]);

  // Extract JSX/HTML from React component code
  const extractJSX = (code: string): string => {
    // Try to find the return statement
    let jsx = code;

    // Look for return ( ... )
    const returnMatch = jsx.match(/return\s*\(([\s\S]*?)\);?\s*$/m);
    if (returnMatch) {
      jsx = returnMatch[1].trim();
    } else {
      // Look for return <...>
      const returnSimpleMatch = jsx.match(/return\s*(<[\s\S]*?>[\s\S]*?<\/[\w-]+>)/);
      if (returnSimpleMatch) {
        jsx = returnSimpleMatch[1];
      }
    }

    // Clean up JSX to make it more HTML-like
    jsx = jsx
      // Convert className to class
      .replace(/className=/g, "class=")
      // Remove event handlers
      .replace(/on\w+?=\{[^}]*\}/g, "")
      // Replace simple expressions with placeholders
      .replace(/\{(['"`])(.*?)\1\}/g, "$2")
      // Replace complex expressions with bullet point
      .replace(/\{([^}]+)\}/g, "[•]")
      // Remove fragments
      .replace(/<>\s*/g, "")
      .replace(/\s*<\/>/g, "");

    return jsx;
  };

  return (
    <div className={clsx(styles.root, className)}>
      {/* Toggle + Copy */}
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => setViewMode("preview")}
          className={clsx(styles.toggleButton, viewMode === "preview" && styles.toggleButtonActive)}
        >
          <Eye className={styles.toggleIcon} />
          Preview
        </button>
        <button
          type="button"
          onClick={() => setViewMode("code")}
          className={clsx(styles.toggleButton, viewMode === "code" && styles.toggleButtonActive)}
        >
          <Code2 className={styles.toggleIcon} />
          Code
        </button>
        {viewMode === "code" && (
          <button
            type="button"
            onClick={handleCopy}
            className={styles.copyButton}
            title="Code kopieren"
            aria-label="Code kopieren"
          >
            {copied ? (
              <>
                <Check className={styles.copyIcon} />
                Kopiert!
              </>
            ) : (
              <>
                <Copy className={styles.copyIcon} />
                Kopieren
              </>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {viewMode === "preview" ? (
          error ? (
            <div className={styles.errorState}>
              <div className={styles.errorCard}>
                <AlertCircle className={styles.errorIcon} />
                <h3 className={styles.errorTitle}>Preview Error</h3>
                <p className={styles.errorText}>{error}</p>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              className={styles.previewFrame}
              sandbox="allow-scripts"
              title="Component Preview"
            />
          )
        ) : (
          <pre className={styles.codePane}>
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
