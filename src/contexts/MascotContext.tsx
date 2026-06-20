"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Mascot } from "@/types/mascot";
import { MASCOTS } from "@/config/mascots";

interface MascotContextType {
  currentMascot: Mascot;
  setMascotId: (id: string) => void;
  availableMascots: Mascot[];
}

const MascotContext = createContext<MascotContextType | undefined>(undefined);

export const MascotProvider = ({ children }: { children: ReactNode }) => {
  const [currentMascotId, setCurrentMascotId] = useState<string>("lily"); // Default to Lily
  const [availableMascots, setAvailableMascots] = useState<Mascot[]>(MASCOTS);
  const [isLoading, setIsLoading] = useState(true);

  // Load mascots from DB and init localStorage preference
  useEffect(() => {
    const fetchMascots = async () => {
      try {
        const res = await fetch("/api/mascots");
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setAvailableMascots(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch mascots from DB, using fallback", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMascots();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const saved = localStorage.getItem("preferred_mascot");
    if (saved && availableMascots.find((m) => m.id === saved)) {
      setCurrentMascotId(saved);
    }
  }, [isLoading, availableMascots]);

  const setMascotId = (id: string) => {
    if (availableMascots.find((m) => m.id === id)) {
      setCurrentMascotId(id);
      localStorage.setItem("preferred_mascot", id);
    }
  };

  const currentMascot = availableMascots.find((m) => m.id === currentMascotId) || availableMascots[0];

  return (
    <MascotContext.Provider value={{ currentMascot, setMascotId, availableMascots }}>
      {children}
    </MascotContext.Provider>
  );
};

export const useMascot = () => {
  const context = useContext(MascotContext);
  if (!context) {
    throw new Error("useMascot must be used within a MascotProvider");
  }
  return context;
};
