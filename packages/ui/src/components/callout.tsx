import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@etape/ui/lib/utils";

function Callout({
  icon: Icon,
  title,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  icon: LucideIcon;
  title: React.ReactNode;
}) {
  return (
    <div
      data-slot="callout"
      className={cn("bg-muted flex items-start gap-4 rounded-lg p-6", className)}
      {...props}
    >
      <div className="bg-secondary shrink-0 rounded-sm p-2">
        <Icon aria-hidden="true" focusable="false" className="text-primary size-6" />
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-body text-foreground font-bold">{title}</p>
        <div className="text-body text-content-secondary">{children}</div>
      </div>
    </div>
  );
}

export { Callout };
