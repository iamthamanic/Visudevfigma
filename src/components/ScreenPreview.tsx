import { useState } from 'react';
import { Eye, Code2, AlertCircle, PlayCircle } from 'lucide-react';
import { LiveProvider, LivePreview, LiveError } from 'react-live';

interface ScreenPreviewProps {
  code: string;
  screenName: string;
}

export function ScreenPreview({ code, screenName }: ScreenPreviewProps) {
  const [viewMode, setViewMode] = useState<'render' | 'code'>('render');

  // Clean and prepare code for live rendering
  const prepareCodeForRendering = (sourceCode: string): string => {
    let cleanedCode = sourceCode;

    // Remove all imports
    cleanedCode = cleanedCode.replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '');
    
    // Remove export statements
    cleanedCode = cleanedCode.replace(/export\s+(default\s+)?/g, '');
    
    // Try to extract just the JSX return
    const returnMatch = cleanedCode.match(/return\s*\(([\s\S]*?)\);/);
    if (returnMatch) {
      return returnMatch[1].trim();
    }
    
    // Fallback: try to find JSX
    const jsxMatch = cleanedCode.match(/return\s+([\s\S]*?);/);
    if (jsxMatch) {
      return jsxMatch[1].trim();
    }
    
    return cleanedCode;
  };

  const renderableCode = prepareCodeForRendering(code);

  // Provide a scope with common components and hooks
  const scope = {
    useState,
    useEffect: (fn: any) => {}, // Mock useEffect to prevent side effects
    // Mock common UI elements
    Button: ({ children, onClick, className, ...props }: any) => (
      <button 
        onClick={onClick}
        className={`px-4 py-2 bg-primary text-white rounded hover:opacity-90 transition ${className || ''}`}
        {...props}
      >
        {children}
      </button>
    ),
    Input: ({ type, placeholder, className, ...props }: any) => (
      <input
        type={type || 'text'}
        placeholder={placeholder}
        className={`px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary ${className || ''}`}
        {...props}
      />
    ),
    Card: ({ children, className, ...props }: any) => (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className || ''}`} {...props}>
        {children}
      </div>
    ),
    // Mock navigation
    Link: ({ href, children, className, ...props }: any) => (
      <a href={href} className={`text-primary hover:underline ${className || ''}`} {...props}>
        {children}
      </a>
    ),
    useRouter: () => ({
      push: (path: string) => console.log('Navigate to:', path),
      pathname: '/current-path'
    }),
    useNavigate: () => (path: string) => console.log('Navigate to:', path),
  };

  return (
    <div className="space-y-3">
      {/* View Mode Toggle */}
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
          Live Render
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

      {/* Content */}
      {viewMode === 'render' ? (
        <div className="bg-white border-2 border-primary/20 rounded-lg overflow-hidden">
          <div className="bg-primary/5 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              🎨 Live Preview: {screenName}
            </span>
            <span className="text-xs text-gray-500">
              Rendering mit Mocks
            </span>
          </div>
          
          <div className="p-6 min-h-[300px] overflow-auto bg-gray-50">
            <LiveProvider 
              code={renderableCode} 
              scope={scope}
              noInline={false}
            >
              <div className="bg-white rounded-lg shadow-sm p-4">
                <LivePreview />
              </div>
              
              <LiveError className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm font-mono" />
            </LiveProvider>
          </div>
          
          <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2 text-xs text-yellow-800">
            ℹ️ Hinweis: Complex Components benötigen möglicherweise zusätzliche Dependencies oder werden als vereinfachte Version gerendert
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto max-h-[500px]">
          <pre className="text-sm font-mono">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}