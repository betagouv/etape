import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@etape/ui/lib/utils";

function Prose({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="prose"
      className={cn(
        "text-body text-foreground",

        "[&_h2]:text-h2 [&_h2]:text-foreground [&_h2]:font-bold [&_h2]:text-balance",
        "[&_h3]:text-body-lg [&_h3]:text-foreground [&_h3]:font-bold [&_h3]:text-balance",

        "[&_p]:text-pretty",
        "[&_strong]:font-semibold",

        "[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-6",
        "[&_li]:marker:text-border-strong",

        "[&_address]:not-italic",

        "[&_a]:text-content-accent [&_a]:underline [&_a]:underline-offset-4",
        "[&_a:hover]:text-content-accent-hover",
        "[&_a]:focus-visible:outline-ring [&_a]:rounded-sm [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2",

        className,
      )}
      {...props}
    />
  );
}

export { Prose };
