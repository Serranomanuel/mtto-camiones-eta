"use client";

import { useState, useEffect, useCallback } from "react";
import type { Conductor } from "@/types/etalum";
import { conductores } from "@/lib/mock-data";

function generateId(): string {
  const num = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
  return `CON-${num}`;
}

export function useConductores() {
  const [data, setData] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setData([...conductores]);
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
    async (item: Omit<Conductor, "id">): Promise<Conductor> => {
      return new Promise<Conductor>((resolve) => {
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
    async (id: string, item: Partial<Conductor>): Promise<Conductor> => {
      return new Promise<Conductor>((resolve) => {
        setTimeout(() => {
          setData((prev) =>
            prev.map((d) => (d.id === id ? { ...d, ...item } : d))
          );
          resolve({ ...item, id } as Conductor);
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

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    delete: deleteItem,
  };
}
