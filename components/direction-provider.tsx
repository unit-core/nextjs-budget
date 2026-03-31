"use client";

import * as React from "react";
import { Direction } from "radix-ui";

interface DirectionProviderProps {
  direction: "ltr" | "rtl";
  children: React.ReactNode;
}

export function DirectionProvider({
  direction,
  children,
}: DirectionProviderProps) {
  return (
    <Direction.Provider dir={direction}>
      {children}
    </Direction.Provider>
  );
}
