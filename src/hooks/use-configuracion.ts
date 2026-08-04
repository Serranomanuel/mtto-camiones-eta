"use client";

import { useState, useEffect, useCallback } from "react";
import type { Parametro } from "@/types/etalum";

const STORAGE_KEY = "etalum-configuracion";

const DEFAULT_PARAMS: Parametro[] = [
  { parametro: "Moneda", valor: "COP", descripcion: "Moneda del sistema" },
  { parametro: "Año vigente", valor: "2026", descripcion: "Año fiscal en curso" },
  { parametro: "Precio combustible referencia", valor: "14250", descripcion: "Precio de referencia del galón de diésel en COP" },
  { parametro: "Google Maps API Key", valor: "[PROXIMAMENTE]", descripcion: "API Key para integración con Google Maps" },
  { parametro: "Nombre empresa", valor: "ETALUM S.A.S.", descripcion: "Nombre comercial de la empresa" },
];

function loadFromStorage(): Parametro[] {
  if (typeof window === "undefined") return [...DEFAULT_PARAMS];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // fallback to defaults
  }
  return [...DEFAULT_PARAMS];
}

function saveToStorage(params: Parametro[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch {
    // silently fail
  }
}

export function useConfiguracion() {
  const [data, setData] = useState<Parametro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setData(loadFromStorage());
      } catch {
        setError("Error al cargar configuración");
      } finally {
        setLoading(false);
      }
    }, 800);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const update = useCallback(
    async (parametro: string, valor: string): Promise<Parametro> => {
      return new Promise<Parametro>((resolve) => {
        setTimeout(() => {
          setData((prev) => {
            const exists = prev.find((p) => p.parametro === parametro);
            const next = exists
              ? prev.map((p) =>
                  p.parametro === parametro ? { ...p, valor } : p
                )
              : [...prev, { parametro, valor, descripcion: "" }];
            saveToStorage(next);
            return next;
          });
          resolve({ parametro, valor, descripcion: "" });
        }, 300);
      });
    },
    []
  );

  const reset = useCallback(async (): Promise<void> => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setData([...DEFAULT_PARAMS]);
        saveToStorage(DEFAULT_PARAMS);
        resolve();
      }, 300);
    });
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    update,
    reset,
  };
}
