/**
 * Skeleton: Loading placeholder (T2-013). Für Listen/Grids während des Ladens.
 * Location: src/components/ui/Skeleton.tsx
 */

import * as React from "react";
import styles from "./Skeleton.module.css";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={`${styles.skeleton} ${className ?? ""}`} {...props} />
));
Skeleton.displayName = "Skeleton";

export { Skeleton };
