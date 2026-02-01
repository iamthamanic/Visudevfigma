import { useState, useEffect, useRef } from "react";
import { PlayCircle, Code2, Monitor, Smartphone } from "lucide-react";
import styles from "./IFrameScreenRenderer.module.css";

interface IFrameScreenRendererProps {
  code: string;
  screenName: string;
}

const extractJSX = (sourceCode: string): string => {
  // Remove imports
  const code = sourceCode.replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, "");

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

  return "<div><p>No JSX found</p></div>";
};

const convertJSXToHTML = (jsx: string): string => {
  return (
    jsx
      // className -> class
      .replace(/className=/g, "class=")
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
      .replace(/on\w+?=\{[^}]*\}/g, "")
      // Replace simple JSX expressions
      .replace(/\{([^}]+)\}/g, (match, p1) => {
        // If it's just a variable, show placeholder
        if (p1.trim().match(/^[\w.]+$/)) {
          return `<span>[${p1.trim()}]</span>`;
        }
        // If it's a function call or complex expression
        return "[value]";
      })
      // Remove fragments
      .replace(/<>\s*/g, "")
      .replace(/<\/>\s*/g, "")
  );
};

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
    :root {
      --preview-bg: transparent;
    }
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--preview-bg);
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

export function IFrameScreenRenderer({ code, screenName }: IFrameScreenRendererProps) {
  const [viewMode, setViewMode] = useState<"render" | "code">("render");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (viewMode === "render" && iframeRef.current) {
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

  return (
    <div className={styles.root}>
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.toggleGroup}>
          <button
            onClick={() => setViewMode("render")}
            type="button"
            data-active={viewMode === "render"}
            className={styles.toggleButton}
          >
            <PlayCircle className={styles.toggleIcon} />
            Preview
          </button>
          <button
            onClick={() => setViewMode("code")}
            type="button"
            data-active={viewMode === "code"}
            className={styles.toggleButton}
          >
            <Code2 className={styles.toggleIcon} />
            Code
          </button>
        </div>

        {viewMode === "render" && (
          <div className={styles.deviceToggle}>
            <button
              onClick={() => setDeviceMode("desktop")}
              type="button"
              data-active={deviceMode === "desktop"}
              className={styles.deviceButton}
              title="Desktop View"
            >
              <Monitor className={styles.deviceIcon} />
            </button>
            <button
              onClick={() => setDeviceMode("mobile")}
              type="button"
              data-active={deviceMode === "mobile"}
              className={styles.deviceButton}
              title="Mobile View"
            >
              <Smartphone className={styles.deviceIcon} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "render" ? (
        <div className={styles.previewWrap}>
          {/* Preview Header */}
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>🎨 {screenName}</span>
            <span className={styles.previewMeta}>
              {deviceMode === "desktop" ? "1200px" : "375px"} viewport
            </span>
          </div>

          {/* IFrame Container */}
          <div className={styles.previewBody}>
            <div className={styles.previewFrame} data-device={deviceMode}>
              <iframe
                ref={iframeRef}
                title={`Preview: ${screenName}`}
                className={styles.previewIframe}
                sandbox="allow-scripts"
              />
            </div>
          </div>

          {/* Footer */}
          <div className={styles.previewFooter}>
            <p className={styles.previewNotice}>
              ℹ️ Static Preview: Interaktionen werden als Alerts angezeigt. State & APIs sind nicht
              funktional.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.codeWrap}>
          <div className={styles.codeHeader}>
            <span className={styles.codeFile}>{screenName}.tsx</span>
            <span className={styles.codeLines}>{code.split("\n").length} lines</span>
          </div>
          <div className={styles.codeBody}>
            <pre className={styles.codePre}>
              <code>{code}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
