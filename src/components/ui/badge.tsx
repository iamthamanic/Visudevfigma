import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "./utils";
import styles from "./Badge.module.css";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant; asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(styles.badge, className)}
      {...props}
    />
  );
}

export { Badge };
