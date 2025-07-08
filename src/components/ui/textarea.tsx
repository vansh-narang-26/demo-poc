import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex w-full text-base transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
  {
    variants: {
      variant: {
        default:
          "border-input placeholder:text-muted-foreground focus-visible:border-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 rounded-md border bg-transparent px-3 py-2 shadow-xs",
        filled:
          "bg-muted border-0 placeholder:text-muted-foreground focus-visible:bg-background rounded-md px-3 py-2 shadow-xs",
        unstyled: "bg-transparent border-0 p-0 shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TextareaProps
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof textareaVariants> {
  autosize?: boolean;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
}

function Textarea({
  className,
  variant,
  autosize = false,
  minRows = 1,
  maxRows = 10,
  disabled = false,
  ...props
}: TextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || !autosize) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Calculate the height based on content
    const scrollHeight = textarea.scrollHeight;

    // Get actual line height from computed styles
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight =
      parseInt(computedStyle.lineHeight, 10) ||
      parseInt(computedStyle.fontSize, 10) * 1.2;
    const paddingTop = parseInt(computedStyle.paddingTop, 10) || 0;
    const paddingBottom = parseInt(computedStyle.paddingBottom, 10) || 0;
    const borderTop = parseInt(computedStyle.borderTopWidth, 10) || 0;
    const borderBottom = parseInt(computedStyle.borderBottomWidth, 10) || 0;

    // Calculate min and max heights based on rows (content height + padding + borders)
    const minContentHeight = lineHeight * minRows;
    const maxContentHeight = lineHeight * maxRows;
    const minHeight =
      minContentHeight + paddingTop + paddingBottom + borderTop + borderBottom;
    const maxHeight =
      maxContentHeight + paddingTop + paddingBottom + borderTop + borderBottom;

    // Set the height within bounds
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [autosize, minRows, maxRows]);

  React.useEffect(() => {
    if (autosize) {
      adjustHeight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustHeight, props.value]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (autosize) {
      adjustHeight();
    }
    if (props.onInput) {
      props.onInput(e);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      data-slot="textarea"
      className={cn(textareaVariants({ variant }), className)}
      onInput={handleInput}
      disabled={disabled}
      style={{
        ...(!autosize && minRows && { minHeight: `${minRows * 1.5}rem` }),
        ...(!autosize && maxRows && { maxHeight: `${maxRows * 1.5}rem` }),
        ...props.style,
      }}
      {...props}
    />
  );
}

export { Textarea, textareaVariants };
