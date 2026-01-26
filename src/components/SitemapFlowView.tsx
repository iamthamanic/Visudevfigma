import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Home } from 'lucide-react';
import { ScreenDetailView } from './ScreenDetailView';

interface Screen {
  id: string;
  name: string;
  path: string;
  filePath?: string;
  type?: 'page' | 'screen' | 'view';
  flows?: string[];
  navigatesTo?: string[];
  framework?: string;
  componentCode?: string;
  screenshotUrl?: string;
  screenshotStatus?: 'none' | 'pending' | 'ok' | 'failed';
  lastScreenshotCommit?: string;
  depth?: number;
}

interface CodeFlow {
  id: string;
  type: 'ui-event' | 'function-call' | 'api-call' | 'db-query' | 'navigation' | 'api';
  name: string;
  file?: string;
  line?: number;
  code?: string;
  calls?: string[];
  color?: string;
  source?: string;
  target?: string;
  trigger?: string;
  description?: string;
}

interface SitemapFlowViewProps {
  screens: Screen[];
  flows: CodeFlow[];
  framework?: {
    detected: string[];
    primary: string | null;
    confidence: number;
  };
}

interface ScreenPosition {
  x: number;
  y: number;
  depth: number;
}

export function SitemapFlowView({ screens, flows, framework }: SitemapFlowViewProps) {
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [detailViewScreen, setDetailViewScreen] = useState<Screen | null>(null);
  const [zoom, setZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [screenPositions, setScreenPositions] = useState<Map<string, ScreenPosition>>(new Map());

  // Auto-layout screens
  useEffect(() => {
    if (screens.length === 0) return;

    console.log('[SitemapFlowView] 🎨 Layout screens:', screens.length);
    console.log('[SitemapFlowView] 📋 Screens:', screens.map(s => ({ name: s.name, path: s.path, navigatesTo: s.navigatesTo })));

    const positions = new Map<string, ScreenPosition>();
    const CARD_WIDTH = 480;
    const CARD_HEIGHT = 360;
    const HORIZONTAL_SPACING = 100;
    const VERTICAL_SPACING = 80;
    const SCREENS_PER_ROW = 4; // Grid layout: 4 screens per row (larger cards)

    // Calculate depths
    const screenDepths = calculateScreenDepths(screens);
    console.log('[SitemapFlowView] 📊 Screen depths:', Array.from(screenDepths.entries()));
    
    // Group by depth
    const columns: Screen[][] = [];
    screens.forEach(screen => {
      const depth = screenDepths.get(screen.id) || 0;
      if (!columns[depth]) columns[depth] = [];
      columns[depth].push(screen);
    });

    console.log('[SitemapFlowView] 📐 Columns:', columns.map((col, idx) => `Depth ${idx}: ${col.length} screens`));

    // If all screens are in depth 0 (no navigation detected), use GRID layout
    if (columns.length === 1 || screens.length === columns[0]?.length) {
      console.log('[SitemapFlowView] ⚠️ All screens at depth 0 - using GRID layout instead');
      
      // Grid layout
      let currentX = 100;
      let currentY = 100;
      let screensInRow = 0;

      screens.forEach((screen, index) => {
        positions.set(screen.id, {
          x: currentX,
          y: currentY,
          depth: 0
        });
        console.log(`[SitemapFlowView] 📍 Grid position ${screen.name} at (${currentX}, ${currentY})`);

        screensInRow++;
        if (screensInRow >= SCREENS_PER_ROW) {
          // Move to next row
          currentX = 100;
          currentY += CARD_HEIGHT + VERTICAL_SPACING;
          screensInRow = 0;
        } else {
          // Move to next column
          currentX += CARD_WIDTH + HORIZONTAL_SPACING;
        }
      });
    } else {
      // Depth-based layout (original)
      let currentX = 100;
      columns.forEach((column) => {
        column.sort((a, b) => a.name.localeCompare(b.name));
        
        let currentY = 100;
        column.forEach((screen) => {
          const depth = screenDepths.get(screen.id) || 0;
          positions.set(screen.id, {
            x: currentX,
            y: currentY,
            depth
          });
          console.log(`[SitemapFlowView] 📍 Position ${screen.name} at (${currentX}, ${currentY})`);
          currentY += CARD_HEIGHT + VERTICAL_SPACING;
        });
        currentX += CARD_WIDTH + HORIZONTAL_SPACING;
      });
    }

    console.log('[SitemapFlowView] ✓ Total positions calculated:', positions.size);
    setScreenPositions(positions);
  }, [screens]);

  // Calculate screen depths
  const calculateScreenDepths = (screens: Screen[]): Map<string, number> => {
    const depths = new Map<string, number>();
    const visited = new Set<string>();

    // Find root screens
    const rootScreens = screens.filter(s => 
      s.path === '/' || 
      s.path === '/home' || 
      s.path === '/login' ||
      s.path === '/index' ||
      s.name.toLowerCase().includes('home') ||
      s.name.toLowerCase().includes('index')
    );
    
    if (rootScreens.length === 0 && screens.length > 0) {
      rootScreens.push(screens[0]);
    }

    // BFS
    const queue: Array<{ screen: Screen; depth: number }> = rootScreens.map(s => ({ screen: s, depth: 0 }));
    
    while (queue.length > 0) {
      const { screen, depth } = queue.shift()!;
      
      if (visited.has(screen.id)) continue;
      visited.add(screen.id);
      depths.set(screen.id, depth);

      // Safe access to navigatesTo (might be undefined in our new store)
      const navigatesTo = screen.navigatesTo || [];
      navigatesTo.forEach(targetPath => {
        const targetScreen = screens.find(s => s.path === targetPath || s.path.includes(targetPath));
        if (targetScreen && !visited.has(targetScreen.id)) {
          queue.push({ screen: targetScreen, depth: depth + 1 });
        }
      });
    }

    // Set depth 0 for remaining
    screens.forEach(screen => {
      if (!depths.has(screen.id)) {
        depths.set(screen.id, 0);
      }
    });

    return depths;
  };

  // Generate mini preview
  const generateMiniPreview = (code: string): string => {
    if (!code) return '<div class="text-gray-400 text-xs p-2">No preview</div>';

    let jsx = code;
    const returnMatch = jsx.match(/return\s*\(([\s\S]*?)\);/);
    if (returnMatch) {
      jsx = returnMatch[1];
    }

    jsx = jsx
      .replace(/className=/g, 'class=')
      .replace(/onClick=\{[^}]*\}/g, '')
      .replace(/on\w+?=\{[^}]*\}/g, '')
      .replace(/\{([^}]+)\}/g, '[•]');

    return jsx.substring(0, 500); // Limit length
  };

  // Render connection lines
  const renderConnections = () => {
    const connections: JSX.Element[] = [];

    screens.forEach(sourceScreen => {
      const sourcePos = screenPositions.get(sourceScreen.id);
      if (!sourcePos) return;

      const navigatesTo = sourceScreen.navigatesTo || [];
      navigatesTo.forEach((targetPath, index) => {
        const targetScreen = screens.find(s => s.path === targetPath || s.path.includes(targetPath));
        if (!targetScreen) return;

        const targetPos = screenPositions.get(targetScreen.id);
        if (!targetPos) return;

        const startX = sourcePos.x + 180; // Card width
        const startY = sourcePos.y + 120; // Half card height
        const endX = targetPos.x;
        const endY = targetPos.y + 120;

        const connectionId = `${sourceScreen.id}-${targetScreen.id}-${index}`;

        // Bezier curve for smoother lines
        const controlX = startX + (endX - startX) / 2;
        const pathD = `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`;

        connections.push(
          <svg
            key={connectionId}
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
              overflow: 'visible'
            }}
          >
            <defs>
              <marker
                id={`arrow-${connectionId}`}
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill="#03ffa3" opacity="0.6" />
              </marker>
            </defs>
            <path
              d={pathD}
              stroke="#03ffa3"
              strokeWidth="1.5"
              fill="none"
              markerEnd={`url(#arrow-${connectionId})`}
              opacity="0.4"
            />
          </svg>
        );
      });
    });

    return connections;
  };

  // Get flow stats
  const getFlowStats = (screen: Screen) => {
    const screenFlows = flows.filter(flow => screen.flows?.includes(flow.id));
    return {
      uiEvents: screenFlows.filter(f => f.type === 'ui-event').length,
      apiCalls: screenFlows.filter(f => f.type === 'api-call').length,
      dbQueries: screenFlows.filter(f => f.type === 'db-query').length,
      total: screenFlows.length
    };
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 2));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.2));
  const handleZoomReset = () => {
    setZoom(0.5);
    setPan({ x: 100, y: 100 });
  };

  if (screens.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-500">Keine Screens gefunden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl mb-1">App Sitemap</h2>
          <p className="text-xs text-gray-600">
            {screens.length} Screens • {flows.length} Flows
            {framework?.primary && <> • {framework.primary}</>}
          </p>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-600 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomReset}
            className="p-2 hover:bg-gray-100 rounded transition-colors ml-2"
            title="Reset View"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden bg-gray-50 relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'relative',
            width: 'fit-content',
            height: 'fit-content'
          }}
        >
          {/* Connection Lines */}
          {renderConnections()}

          {/* Screen Cards */}
          {screens.map(screen => {
            const position = screenPositions.get(screen.id);
            if (!position) return null;

            const stats = getFlowStats(screen);
            const isSelected = selectedScreen === screen.id;

            return (
              <div
                key={screen.id}
                className={`absolute bg-white rounded-lg shadow-md border transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-primary ring-2 ring-primary/30 z-20' 
                    : 'border-gray-200 hover:border-primary/50 hover:shadow-lg z-10'
                }`}
                style={{
                  left: position.x,
                  top: position.y,
                  width: '480px'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedScreen(screen.id);
                  setDetailViewScreen(screen);
                }}
              >
                {/* Header */}
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-medium truncate mb-1" title={screen.name}>
                    {screen.name}
                  </h3>
                  <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded truncate block">
                    {screen.path}
                  </code>
                </div>

                {/* Mini Preview */}
                <div className="h-64 bg-gray-100 border-b border-gray-200 overflow-hidden relative">
                  {screen.screenshotUrl ? (
                    // Use screenshot if available
                    <img 
                      src={screen.screenshotUrl} 
                      alt={screen.name}
                      className="w-full h-full object-contain bg-gray-900"
                    />
                  ) : screen.componentCode ? (
                    // Fallback to iframe preview (keep smaller scale)
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <script src="https://cdn.tailwindcss.com"></script>
                          <style>
                            body { 
                              margin: 0; 
                              padding: 8px; 
                              font-family: system-ui; 
                              transform: scale(0.3); 
                              transform-origin: top left; 
                              width: 333%;
                              font-size: 14px;
                            }
                            * { box-sizing: border-box; }
                          </style>
                        </head>
                        <body>${generateMiniPreview(screen.componentCode)}</body>
                        </html>
                      `}
                      className="w-full h-full border-0 pointer-events-none"
                      sandbox="allow-scripts"
                      title={screen.name}
                    />
                  ) : (
                    // Default placeholder
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <span className="text-5xl mb-2 block">📄</span>
                        <span className="text-xs">No preview</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Screenshot status badge */}
                  {screen.screenshotStatus && screen.screenshotStatus !== 'none' && (
                    <div className="absolute top-2 right-2">
                      <span className={`text-xs px-2 py-1 rounded font-medium shadow-sm ${
                        screen.screenshotStatus === 'ok' ? 'bg-green-500/90 text-white' :
                        screen.screenshotStatus === 'pending' ? 'bg-yellow-500/90 text-white' :
                        'bg-red-500/90 text-white'
                      }`}>
                        {screen.screenshotStatus === 'ok' ? '✓ Screenshot' : 
                         screen.screenshotStatus === 'pending' ? '⏳ Pending' : 
                         '⚠ Screenshot failed'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Stats */}
                <div className="p-3 bg-white">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {stats.uiEvents > 0 && (
                        <span className="text-gray-600" title="UI Events">⚡ {stats.uiEvents}</span>
                      )}
                      {stats.apiCalls > 0 && (
                        <span className="text-gray-600" title="API Calls">🌐 {stats.apiCalls}</span>
                      )}
                      {stats.dbQueries > 0 && (
                        <span className="text-gray-600" title="DB Queries">🗄️ {stats.dbQueries}</span>
                      )}
                    </div>
                    {screen.navigatesTo?.length > 0 && (
                      <span className="text-primary font-medium">{screen.navigatesTo.length} →</span>
                    )}
                  </div>
                  
                  {/* Screenshot failed feedback */}
                  {screen.screenshotStatus === 'failed' && (
                    <div className="mt-2 text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded">
                      Screenshot fehlgeschlagen – zeige Code-Preview
                    </div>
                  )}
                  
                  <div className="text-[10px] text-gray-400 mt-2">
                    Depth: {position.depth} • {screen.filePath || 'Unknown file'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs text-gray-600 flex-shrink-0">
        💡 <strong>Tip:</strong> Klick & Drag zum Verschieben • Mausrad zum Zoomen • Klick auf Screen für Details
      </div>

      {/* Detail View */}
      {detailViewScreen && (
        <ScreenDetailView
          screen={detailViewScreen}
          flows={flows}
          onClose={() => setDetailViewScreen(null)}
        />
      )}
    </div>
  );
}