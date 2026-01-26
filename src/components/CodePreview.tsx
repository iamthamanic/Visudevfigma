/**
 * CodePreview Component
 * 
 * Renders React/JSX code in an isolated iframe
 */

import React, { useEffect, useRef, useState } from 'react';
import { Eye, Code2, AlertCircle } from 'lucide-react';

interface CodePreviewProps {
  code: string;
  className?: string;
}

export function CodePreview({ code, className = '' }: CodePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || viewMode !== 'preview') return;

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
              background: white;
              color: #000;
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
      console.error('[CodePreview] Error rendering preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to render preview');
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
      .replace(/className=/g, 'class=')
      // Remove event handlers
      .replace(/on\w+?=\{[^}]*\}/g, '')
      // Replace simple expressions with placeholders
      .replace(/\{(['"`])(.*?)\1\}/g, '$2')
      // Replace complex expressions with bullet point
      .replace(/\{([^}]+)\}/g, '[•]')
      // Remove fragments
      .replace(/<>\s*/g, '')
      .replace(/\s*<\/>/g, '');
    
    return jsx;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toggle */}
      <div className="flex items-center gap-2 p-2 border-b border-white/10 bg-black/20">
        <button
          onClick={() => setViewMode('preview')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
            viewMode === 'preview'
              ? 'bg-[#03ffa3]/10 text-[#03ffa3] border border-[#03ffa3]/20'
              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <Eye className="w-3 h-3" />
          Preview
        </button>
        <button
          onClick={() => setViewMode('code')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
            viewMode === 'code'
              ? 'bg-[#03ffa3]/10 text-[#03ffa3] border border-[#03ffa3]/20'
              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <Code2 className="w-3 h-3" />
          Code
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'preview' ? (
          error ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white/80 mb-2">Preview Error</h3>
                <p className="text-xs text-white/50">{error}</p>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts"
              title="Component Preview"
            />
          )
        ) : (
          <pre className="p-4 text-xs font-mono text-white/80 bg-black/40 h-full overflow-auto">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
