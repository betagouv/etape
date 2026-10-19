"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

import { cn } from "@etape/ui/lib/utils";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  descriptionId: string;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltip(): TooltipContextValue {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error("TooltipTrigger et TooltipContent vont dans un Tooltip.");
  return context;
}

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

const TOOLTIP_OPEN_EVENT = "etape-tooltip-open";

function Tooltip({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const id = React.useId();
  const descriptionId = React.useId();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (next) document.dispatchEvent(new CustomEvent(TOOLTIP_OPEN_EVENT, { detail: id }));
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [id, onOpenChange],
  );

  React.useEffect(() => {
    if (!open) return;
    const closeIfAnother = (event: Event): void => {
      if ((event as CustomEvent<string>).detail !== id) setOpen(false);
    };
    document.addEventListener(TOOLTIP_OPEN_EVENT, closeIfAnother);
    return () => document.removeEventListener(TOOLTIP_OPEN_EVENT, closeIfAnother);
  }, [open, id, setOpen]);

  const context = React.useMemo(
    () => ({ open, setOpen, descriptionId }),
    [open, setOpen, descriptionId],
  );

  return (
    <TooltipContext.Provider value={context}>
      <TooltipPrimitive.Root data-slot="tooltip" open={open} onOpenChange={setOpen} {...props} />
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({
  onPointerDown,
  onClick,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const { open, setOpen, descriptionId } = useTooltip();
  const wasOpenRef = React.useRef<boolean | null>(null);

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      aria-describedby={open ? undefined : descriptionId}
      onPointerDown={(event) => {
        wasOpenRef.current = open;
        onPointerDown?.(event);
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        setOpen(!(wasOpenRef.current ?? open));
        wasOpenRef.current = null;
      }}
      {...props}
    />
  );
}

function TooltipContent({
  className,
  sideOffset = 0,
  collisionPadding = 16,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const { open, descriptionId } = useTooltip();

  return (
    <>
      {!open && (
        <span id={descriptionId} hidden>
          {children}
        </span>
      )}
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          data-slot="tooltip-content"
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          className={cn(
            "animate-in border-background bg-primary text-primary-foreground fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 z-50 w-fit max-w-[min(357px,calc(100vw_-_2rem))] origin-(--radix-tooltip-content-transform-origin) rounded-md border px-3 py-1.5 text-center text-xs text-balance",
            className,
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow
            data-slot="tooltip-arrow"
            className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]"
          />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
