"use client";

import { useState, useEffect, useCallback } from "react";
import type { Combustible } from "@/types/etalum";
import { combustibles } from "@/lib/mock-data";

function generateId(): string {
  const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `COM-${num}`;
}

export function useCombustible() {
  const [data, setData] = useState<Combustible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setData([...combustibles]);
      } catch {
        setError("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }, 800);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(
    async (item: Omit<Combustible, "id">): Promise<Combustible> => {
      return new Promise<Combustible>((resolve) => {
        setTimeout(() => {
          const newItem = { ...item, id: generateId() };
          setData((prev) => [...prev, newItem]);
          resolve(newItem);
        }, 500);
      });
    },
    []
  );

  const update = useCallback(
    async (id: string, item: Partial<Combustible>): Promise<Combustible> => {
      return new Promise<Combustible>((resolve) => {
        setTimeout(() => {
          setData((prev) =>
            prev.map((d) => (d.id === id ? { ...d, ...item } : d))
          );
          resolve({ ...item, id } as Combustible);
        }, 500);
      });
    },
    []
  );

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setData((prev) => prev.filter((d) => d.id !== id));
        resolve();
      }, 500);
    });
  }, []);

  const getPrecioActual = useCallback(
    (ciudad: string, tipo: Combustible["tipo"]): Combustible | undefined => {
      return data
        .filter((c) => c.ciudad === ciudad && c.tipo === tipo)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
    },
    [data]
  );

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    delete: deleteItem,
    getPrecioActual,
  };
}
