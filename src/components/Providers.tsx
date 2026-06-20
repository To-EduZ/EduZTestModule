"use client";

import React from "react";
import { MascotProvider } from "@/contexts/MascotContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MascotProvider>
      {children}
    </MascotProvider>
  );
}
