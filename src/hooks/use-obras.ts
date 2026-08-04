"use client";

import { useState, useEffect, useCallback } from "react";
import type { Obra } from "@/types/etalum";
import { obras } from "@/lib/mock-data";

function generateId(): string {
  const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `OB-${num}`;
}

export interface ObraFilters {
  ciudad?: string;
  estadoObra?: Obra["estadoObra"];
  clienteId?: string;
}

export function useObras() {
  const [data, setData] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setData([...obras]);
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
    async (item: Omit<Obra, "id">): Promise<Obra> => {
      return new Promise<Obra>((resolve) => {
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
    async (id: string, item: Partial<Obra>): Promise<Obra> => {
      return new Promise<Obra>((resolve) => {
        setTimeout(() => {
          setData((prev) =>
            prev.map((d) => (d.id === id ? { ...d, ...item } : d))
          );
          resolve({ ...item, id } as Obra);
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

  const filterBy = useCallback(
    (filters: ObraFilters): Obra[] => {
      return data.filter((o) => {
        if (filters.ciudad && o.ciudad !== filters.ciudad) return false;
        if (filters.estadoObra && o.estadoObra !== filters.estadoObra)
          return false;
        if (filters.clienteId && o.clienteId !== filters.clienteId) return false;
        return true;
      });
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
    filterBy,
  };
}
