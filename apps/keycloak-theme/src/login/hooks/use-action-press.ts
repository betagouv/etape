import { type RefObject, useEffect, useRef } from "react";

const ACTION_SELECTOR = "a, button, label, input[type='checkbox']";

export function useActionPress(): RefObject<boolean> {
  const isActionPressed = useRef(false);

  useEffect(() => {
    const press = (event: MouseEvent): void => {
      isActionPressed.current =
        event.target instanceof Element && event.target.closest(ACTION_SELECTOR) !== null;
    };
    const release = (): void => {
      isActionPressed.current = false;
    };
    document.addEventListener("mousedown", press, true);
    document.addEventListener("mouseup", release, true);
    return () => {
      document.removeEventListener("mousedown", press, true);
      document.removeEventListener("mouseup", release, true);
    };
  }, []);

  return isActionPressed;
}
