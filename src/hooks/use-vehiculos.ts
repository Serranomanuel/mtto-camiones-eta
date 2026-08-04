"use client";

import { useState, useEffect, useCallback } from "react";
import type { Vehiculo } from "@/types/etalum";
import { vehiculos } from "@/lib/mock-data";

function generateId(): string {
  const num = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
  return `VEH-${num}`;
}

export function useVehiculos() {
  const [data, setData] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setData([...vehiculos]);
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
    async (item: Omit<Vehiculo, "id">): Promise<Vehiculo> => {
      return new Promise<Vehiculo>((resolve) => {
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
    async (id: string, item: Partial<Vehiculo>): Promise<Vehiculo> => {
      return new Promise<Vehiculo>((resolve) => {
        setTimeout(() => {
          setData((prev) =>
            prev.map((d) => (d.id === id ? { ...d, ...item } : d))
          );
          resolve({ ...item, id } as Vehiculo);
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
