import { useState, useEffect } from 'react';
import { PlayCircle, Code2, AlertTriangle } from 'lucide-react';

interface LiveScreenRendererProps {
  code: string;
  screenName: string;
}

export function LiveScreenRenderer({ code, screenName }: LiveScreenRendererProps) {
  const [viewMode, setViewMode] = useState<'render' | 'code'>('render');
  const [renderedHTML, setRenderedHTML] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Extract JSX/HTML structure from the code
      const htmlPreview = convertJSXToHTML(code);
      setRenderedHTML(htmlPreview);
      setError(null);
    } catch (err) {
      setError(String(err));
      setRenderedHTML('');
    }
  }, [code]);

  // Convert JSX to renderable HTML structure
  const convertJSXToHTML = (sourceCode: string): string => {
    // Extract the main return statement
    let jsxCode = sourceCode;
    
    // Remove imports
    jsxCode = jsxCode.replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '');
    
    // Find the return statement
    const returnMatch = jsxCode.match(/return\s*\(([\s\S]*?)\);/);
    if (returnMatch) {
      jsxCode = returnMatch[1];
    }
    
    // Simple JSX to HTML conversion
    jsxCode = jsxCode
      // Convert className to class
      .replace(/className=/g, 'class=')
      // Remove onClick handlers (show as disabled)
      .replace(/onClick=\{[^}]*\}/g, 'style="cursor: not-allowed; opacity: 0.7"')
      // Remove other event handlers
      .replace(/on\w+?=\{[^}]*\}/g, '')
      // Replace {variable} with placeholder
      .replace(/\{([^}]+)\}/g, (match, p1) => {
        // Simple variable replacements
        if (p1.includes('?')) return '[conditional]';
        if (p1.includes('map')) return '';
        return `[${p1.trim()}]`;
      });
    
    return jsxCode;
  };

  const renderPreview = () => {
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-700 font-medium">
            Render Error
          </p>
          <p className="text-xs text-red-600 mt-2">
            {error}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Preview Frame */}
        <div 
          className="p-6"
          dangerouslySetInnerHTML={{ __html: renderedHTML }}
          style={{
            minHeight: '300px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Toggle Buttons */}
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
          Visual Preview
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
          Source Code
        </button>
      </div>

      {/* Content Area */}
      {viewMode === 'render' ? (
        <div className="border-2 border-primary/20 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                🎨 {screenName}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Static Preview
            </span>
          </div>

          {/* Preview Content */}
          <div className="p-4 bg-gray-50">
            {renderPreview()}
          </div>

          {/* Footer Notice */}
          <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2">
            <p className="text-xs text-yellow-800">
              ⚠️ Hinweis: Interaktive Features (onClick, State, etc.) sind deaktiviert. Dies ist eine statische Vorschau der Struktur.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-xs text-gray-400">{screenName}.tsx</span>
          </div>
          <div className="p-4 overflow-auto max-h-[500px]">
            <pre className="text-sm font-mono">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
