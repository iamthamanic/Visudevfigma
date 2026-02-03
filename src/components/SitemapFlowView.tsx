import { useState, useRef, useEffect, useMemo } from "react";
import clsx from "clsx";
import { ZoomIn, ZoomOut, Home, Search, X } from "lucide-react";
import { ScreenDetailView } from "./ScreenDetailView";
import styles from "./SitemapFlowView.module.css";

interface Screen {
  id: string;
  name: string;
  path: string;
  filePath?: string;
  type?: "page" | "screen" | "view";
  flows?: string[];
  navigatesTo?: string[];
  framework?: string;
  componentCode?: string;
  screenshotUrl?: string;
  screenshotStatus?: "none" | "pending" | "ok" | "failed";
  lastScreenshotCommit?: string;
  depth?: number;
}

interface CodeFlow {
  id: string;
  type: "ui-event" | "function-call" | "api-call" | "db-query" | "navigation" | "api";
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

const CARD_WIDTH = 480;
const CARD_HEIGHT = 360;
const HORIZONTAL_SPACING = 100;
const VERTICAL_SPACING = 80;
const SCREENS_PER_ROW = 4;

type LayerFilter = "" | "ui-event" | "api-call" | "db-query";

export function SitemapFlowView({ screens, flows, framework }: SitemapFlowViewProps) {
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [detailViewScreen, setDetailViewScreen] = useState<Screen | null>(null);
  const [zoom, setZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [layerFilter, setLayerFilter] = useState<LayerFilter>("");
  const canvasRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [screenPositions, setScreenPositions] = useState<Map<string, ScreenPosition>>(new Map());

  const filteredScreens = useMemo(() => {
    let list = screens;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.path ?? "").toLowerCase().includes(q) ||
          (s.filePath ?? "").toLowerCase().includes(q),
      );
    }
    if (layerFilter) {
      list = list.filter((s) => {
        const screenFlowIds = s.flows ?? [];
        const hasType = flows.some(
          (f) => f.type === layerFilter && screenFlowIds.includes(f.id),
        );
        return hasType;
      });
    }
    return list;
  }, [screens, flows, searchQuery, layerFilter]);

  // Auto-layout screens (use filtered list for layout)
  useEffect(() => {
    if (filteredScreens.length === 0) return;

    const positions = new Map<string, ScreenPosition>();

    // Calculate depths
    const screenDepths = calculateScreenDepths(filteredScreens);

    // Group by depth
    const columns: Screen[][] = [];
    filteredScreens.forEach((screen) => {
      const depth = screenDepths.get(screen.id) || 0;
      if (!columns[depth]) columns[depth] = [];
      columns[depth].push(screen);
    });

    // If all screens are in depth 0 (no navigation detected), use GRID layout
    if (columns.length === 1 || filteredScreens.length === columns[0]?.length) {
      // Grid layout
      let currentX = 100;
      let currentY = 100;
      let screensInRow = 0;

      filteredScreens.forEach((screen) => {
        positions.set(screen.id, {
          x: currentX,
          y: currentY,
          depth: 0,
        });

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
            depth,
          });
          currentY += CARD_HEIGHT + VERTICAL_SPACING;
        });
        currentX += CARD_WIDTH + HORIZONTAL_SPACING;
      });
    }

    setScreenPositions(positions);
  }, [filteredScreens]);

  const setCardRef = (id: string) => (node: HTMLDivElement | null) => {
    if (node) {
      cardRefs.current.set(id, node);
    } else {
      cardRefs.current.delete(id);
    }
  };

  useEffect(() => {
    screenPositions.forEach((position, id) => {
      const node = cardRefs.current.get(id);
      if (!node) return;
      node.style.left = `${position.x}px`;
      node.style.top = `${position.y}px`;
      node.style.width = `${CARD_WIDTH}px`;
    });
  }, [screenPositions]);

  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  }, [pan, zoom]);

  // Calculate screen depths
  const calculateScreenDepths = (screens: Screen[]): Map<string, number> => {
    const depths = new Map<string, number>();
    const visited = new Set<string>();

    // Find root screens
    const rootScreens = screens.filter(
      (s) =>
        s.path === "/" ||
        s.path === "/home" ||
        s.path === "/login" ||
        s.path === "/index" ||
        s.name.toLowerCase().includes("home") ||
        s.name.toLowerCase().includes("index"),
    );

    if (rootScreens.length === 0 && screens.length > 0) {
      rootScreens.push(screens[0]);
    }

    // BFS
    const queue: Array<{ screen: Screen; depth: number }> = rootScreens.map((s) => ({
      screen: s,
      depth: 0,
    }));

    while (queue.length > 0) {
      const { screen, depth } = queue.shift()!;

      if (visited.has(screen.id)) continue;
      visited.add(screen.id);
      depths.set(screen.id, depth);

      // Safe access to navigatesTo (might be undefined in our new store)
      const navigatesTo = screen.navigatesTo || [];
      navigatesTo.forEach((targetPath) => {
        const targetScreen = screens.find(
          (s) => s.path === targetPath || s.path.includes(targetPath),
        );
        if (targetScreen && !visited.has(targetScreen.id)) {
          queue.push({ screen: targetScreen, depth: depth + 1 });
        }
      });
    }

    // Set depth 0 for remaining
    screens.forEach((screen) => {
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
      .replace(/className=/g, "class=")
      .replace(/onClick=\{[^}]*\}/g, "")
      .replace(/on\w+?=\{[^}]*\}/g, "")
      .replace(/\{([^}]+)\}/g, "[•]");

    return jsx.substring(0, 500); // Limit length
  };

  // Render connection lines (only between filtered screens)
  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    const filteredIds = new Set(filteredScreens.map((s) => s.id));

    filteredScreens.forEach((sourceScreen) => {
      const sourcePos = screenPositions.get(sourceScreen.id);
      if (!sourcePos) return;

      const navigatesTo = sourceScreen.navigatesTo || [];
      navigatesTo.forEach((targetPath, index) => {
        const targetScreen = filteredScreens.find(
          (s) => s.path === targetPath || s.path.includes(targetPath),
        );
        if (!targetScreen || !filteredIds.has(targetScreen.id)) return;

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
          <svg key={connectionId} className={styles.connectionSvg}>
            <defs>
              <marker
                id={`arrow-${connectionId}`}
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon className={styles.connectionMarker} points="0 0, 8 4, 0 8" />
              </marker>
            </defs>
            <path
              d={pathD}
              className={styles.connectionPath}
              markerEnd={`url(#arrow-${connectionId})`}
            />
          </svg>,
        );
      });
    });

    return connections;
  };

  // Get flow stats
  const getFlowStats = (screen: Screen) => {
    const screenFlows = flows.filter((flow) => screen.flows?.includes(flow.id));
    return {
      uiEvents: screenFlows.filter((f) => f.type === "ui-event").length,
      apiCalls: screenFlows.filter((f) => f.type === "api-call").length,
      dbQueries: screenFlows.filter((f) => f.type === "db-query").length,
      total: screenFlows.length,
    };
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
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

  const hasActiveFilter = searchQuery.trim() !== "" || layerFilter !== "";
  const showFilteredEmpty = screens.length > 0 && filteredScreens.length === 0;

  if (screens.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div>
          <p className={styles.emptyText}>Keine Screens gefunden</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>App Sitemap</h2>
          <p className={styles.headerSubtitle}>
            {filteredScreens.length} Screens • {flows.length} Flows
            {framework?.primary && <> • {framework.primary}</>}
          </p>
        </div>

        {/* Search + Layer Filter */}
        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              placeholder="Screens durchsuchen…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Screens durchsuchen"
            />
          </div>
          <div className={styles.filterGroup}>
            <button
              type="button"
              onClick={() => setLayerFilter("")}
              className={clsx(styles.filterBtn, !layerFilter && styles.filterBtnActive)}
            >
              Alle
            </button>
            <button
              type="button"
              onClick={() => setLayerFilter("ui-event")}
              className={clsx(styles.filterBtn, layerFilter === "ui-event" && styles.filterBtnActive)}
            >
              UI
            </button>
            <button
              type="button"
              onClick={() => setLayerFilter("api-call")}
              className={clsx(styles.filterBtn, layerFilter === "api-call" && styles.filterBtnActive)}
            >
              API
            </button>
            <button
              type="button"
              onClick={() => setLayerFilter("db-query")}
              className={clsx(styles.filterBtn, layerFilter === "db-query" && styles.filterBtnActive)}
            >
              DB
            </button>
          </div>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setLayerFilter("");
              }}
              className={styles.clearBtn}
              title="Filter zurücksetzen"
              aria-label="Filter zurücksetzen"
            >
              <X className={styles.clearIcon} />
              Zurücksetzen
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className={styles.controls}>
          <button
            onClick={handleZoomOut}
            type="button"
            className={styles.zoomButton}
            title="Zoom Out"
          >
            <ZoomOut className={styles.controlIcon} />
          </button>
          <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            type="button"
            className={styles.zoomButton}
            title="Zoom In"
          >
            <ZoomIn className={styles.controlIcon} />
          </button>
          <button
            onClick={handleZoomReset}
            type="button"
            className={styles.zoomButton}
            title="Reset View"
          >
            <Home className={styles.controlIcon} />
          </button>
        </div>
      </div>

      {showFilteredEmpty && (
        <div className={styles.filteredEmpty}>
          <p className={styles.emptyText}>Keine Screens passen zum Filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setLayerFilter("");
            }}
            className={styles.clearBtn}
          >
            <X className={styles.clearIcon} />
            Zurücksetzen
          </button>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={clsx(styles.canvas, isDragging && styles.canvasDragging)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div ref={graphRef} className={styles.graph}>
          {/* Connection Lines */}
          {renderConnections()}

          {/* Screen Cards */}
          {filteredScreens.map((screen) => {
            const position = screenPositions.get(screen.id);
            if (!position) return null;

            const stats = getFlowStats(screen);
            const isSelected = selectedScreen === screen.id;

            return (
              <div
                key={screen.id}
                ref={setCardRef(screen.id)}
                className={clsx(styles.card, isSelected && styles.cardSelected)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedScreen(screen.id);
                  setDetailViewScreen(screen);
                }}
              >
                {/* Header */}
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle} title={screen.name}>
                    {screen.name}
                  </h3>
                  <code className={styles.cardPath}>{screen.path}</code>
                </div>

                {/* Mini Preview */}
                <div className={styles.preview}>
                  {screen.screenshotUrl ? (
                    // Use screenshot if available
                    <img
                      src={screen.screenshotUrl}
                      alt={screen.name}
                      className={styles.previewImage}
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
                      className={styles.previewIframe}
                      sandbox="allow-scripts"
                      title={screen.name}
                    />
                  ) : (
                    // Default placeholder
                    <div className={styles.previewPlaceholder}>
                      <div>
                        <span className={styles.previewPlaceholderIcon}>📄</span>
                        <span>No preview</span>
                      </div>
                    </div>
                  )}

                  {/* Screenshot status badge */}
                  {screen.screenshotStatus && screen.screenshotStatus !== "none" && (
                    <div className={styles.statusBadgeWrap}>
                      <span
                        className={clsx(
                          styles.statusBadge,
                          screen.screenshotStatus === "ok" && styles.statusOk,
                          screen.screenshotStatus === "pending" && styles.statusPending,
                          screen.screenshotStatus === "failed" && styles.statusFailed,
                        )}
                      >
                        {screen.screenshotStatus === "ok"
                          ? "✓ Screenshot"
                          : screen.screenshotStatus === "pending"
                            ? "⏳ Pending"
                            : "⚠ Screenshot failed"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Stats */}
                <div className={styles.cardFooter}>
                  <div className={styles.statsRow}>
                    <div className={styles.statsGroup}>
                      {stats.uiEvents > 0 && (
                        <span className={styles.statItem} title="UI Events">
                          ⚡ {stats.uiEvents}
                        </span>
                      )}
                      {stats.apiCalls > 0 && (
                        <span className={styles.statItem} title="API Calls">
                          🌐 {stats.apiCalls}
                        </span>
                      )}
                      {stats.dbQueries > 0 && (
                        <span className={styles.statItem} title="DB Queries">
                          🗄️ {stats.dbQueries}
                        </span>
                      )}
                    </div>
                    {screen.navigatesTo && screen.navigatesTo.length > 0 && (
                      <span className={styles.navCount}>{screen.navigatesTo.length} →</span>
                    )}
                  </div>

                  {/* Screenshot failed feedback */}
                  {screen.screenshotStatus === "failed" && (
                    <div className={styles.failedNotice}>
                      Screenshot fehlgeschlagen – zeige Code-Preview
                    </div>
                  )}

                  <div className={styles.depthRow}>
                    Depth: {position.depth} • {screen.filePath || "Unknown file"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className={styles.footerHint}>
        💡 <strong>Tip:</strong> Klick & Drag zum Verschieben • Mausrad zum Zoomen • Klick auf
        Screen für Details
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
