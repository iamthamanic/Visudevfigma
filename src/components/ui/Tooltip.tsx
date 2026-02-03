/**
 * Tooltip: Einheitliches Info-Tooltip (STYLEGUIDE: --tooltip-bg, --tooltip-border).
 * Nutzung: Trigger (z. B. Info-Icon) + Content; für Konfigurationshinweise, Shortcuts.
 * Location: src/components/ui/Tooltip.tsx
 */

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import styles from "./Tooltip.module.css";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  "aria-label"?: string;
}

function Tooltip({
  content,
  children,
  side = "top",
  sideOffset = 8,
  "aria-label": ariaLabel,
}: TooltipProps) {
  const label = ariaLabel ?? (typeof content === "string" ? content : "Info");
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            className={`${styles.wrapper} ${styles.trigger}`}
            aria-label={label}
          >
            {children}
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className={styles.content}
            side={side}
            sideOffset={sideOffset}
            collisionPadding={8}
          >
            {content}
            <TooltipPrimitive.Arrow className={styles.arrow} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export { Tooltip };
