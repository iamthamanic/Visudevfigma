import { useState, useEffect, useRef } from 'react';
import { PlayCircle, Code2, Monitor, Smartphone } from 'lucide-react';

interface IFrameScreenRendererProps {
  code: string;
  screenName: string;
}

export function IFrameScreenRenderer({ code, screenName }: IFrameScreenRendererProps) {
  const [viewMode, setViewMode] = useState<'render' | 'code'>('render');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (viewMode === 'render' && iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        // Generate preview HTML
        const html = generatePreviewHTML(code);
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      }
    }
  }, [code, viewMode]);

  const generatePreviewHTML = (sourceCode: string): string => {
    // Extract JSX from the component
    let jsxContent = extractJSX(sourceCode);
    
    // Convert JSX to HTML-like structure
    jsxContent = convertJSXToHTML(jsxContent);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      background: #f9fafb;
    }
    * {
      box-sizing: border-box;
    }
    button {
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  ${jsxContent}
  
  <script>
    // Mock event handlers
    document.querySelectorAll('[data-mock-click]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        alert('🎭 Mock Event: ' + el.getAttribute('data-mock-click'));
      });
    });
  </script>
</body>
</html>
    `;
  };

  const extractJSX = (sourceCode: string): string => {
    // Remove imports
    let code = sourceCode.replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '');
    
    // Extract return statement
    const returnMatch = code.match(/return\s*\(([\s\S]*?)\);/);
    if (returnMatch) {
      return returnMatch[1].trim();
    }
    
    // Fallback: try to find JSX
    const jsxMatch = code.match(/<[\s\S]+>/);
    if (jsxMatch) {
      return jsxMatch[0];
    }
    
    return '<div class="p-8"><p class="text-gray-500">No JSX found</p></div>';
  };

  const convertJSXToHTML = (jsx: string): string => {
    return jsx
      // className -> class
      .replace(/className=/g, 'class=')
      // Remove JSX expressions in attributes
      .replace(/=\{([^}]+)\}/g, (match, p1) => {
        // Try to extract string values
        if (p1.includes('"')) {
          const strMatch = p1.match(/"([^"]+)"/);
          if (strMatch) return `="${strMatch[1]}"`;
        }
        return '=""';
      })
      // Handle onClick with mock
      .replace(/onClick=\{[^}]*\}/g, 'data-mock-click="Button Clicked"')
      // Remove other event handlers
      .replace(/on\w+?=\{[^}]*\}/g, '')
      // Replace simple JSX expressions
      .replace(/\{([^}]+)\}/g, (match, p1) => {
        // If it's just a variable, show placeholder
        if (p1.trim().match(/^[\w.]+$/)) {
          return `<span class="text-gray-600">[${p1.trim()}]</span>`;
        }
        // If it's a function call or complex expression
        return '[value]';
      })
      // Remove fragments
      .replace(/<>\s*/g, '')
      .replace(/<\/>\s*/g, '');
  };

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('render')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              viewMode === 'render'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              viewMode === 'code'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Code
          </button>
        </div>

        {viewMode === 'render' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded transition-colors ${
                deviceMode === 'desktop'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded transition-colors ${
                deviceMode === 'mobile'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'render' ? (
        <div className="border-2 border-primary/20 rounded-lg overflow-hidden bg-gray-50">
          {/* Preview Header */}
          <div className="bg-primary/5 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              🎨 {screenName}
            </span>
            <span className="text-xs text-gray-500">
              {deviceMode === 'desktop' ? '1200px' : '375px'} viewport
            </span>
          </div>

          {/* IFrame Container */}
          <div className="p-6 flex justify-center bg-gray-100">
            <div 
              className="bg-white rounded-lg shadow-lg overflow-hidden transition-all"
              style={{
                width: deviceMode === 'desktop' ? '100%' : '375px',
                maxWidth: deviceMode === 'desktop' ? '1200px' : '375px'
              }}
            >
              <iframe
                ref={iframeRef}
                title={`Preview: ${screenName}`}
                className="w-full border-0"
                style={{
                  minHeight: '500px',
                  height: 'auto'
                }}
                sandbox="allow-scripts"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2">
            <p className="text-xs text-yellow-800">
              ℹ️ Static Preview: Interaktionen werden als Alerts angezeigt. State & APIs sind nicht funktional.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
            <span className="text-xs text-gray-400">{screenName}.tsx</span>
            <span className="text-xs text-gray-500">{code.split('\n').length} lines</span>
          </div>
          <div className="p-4 overflow-auto max-h-[600px]">
            <pre className="text-sm font-mono leading-relaxed">
              <code className="text-gray-200">{code}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
