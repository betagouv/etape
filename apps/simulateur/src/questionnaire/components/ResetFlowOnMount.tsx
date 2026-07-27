"use client";

import * as React from "react";

import { flowStore } from "../state/flow-store";

export function ResetFlowOnMount() {
  React.useEffect(() => {
    flowStore.dispatch({ type: "RESET" });
  }, []);

  return null;
}
