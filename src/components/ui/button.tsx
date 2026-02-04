import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "./utils";
import styles from "./Button.module.css";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    asChild?: boolean;
  }
>(function Button(
  { className, variant = "default", size = "default", asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(styles.button, className)}
      {...props}
    />
  );
});

export { Button };
