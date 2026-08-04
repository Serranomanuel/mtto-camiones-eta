"use client";

import { useState, useEffect, useCallback } from "react";
import type { Viaje } from "@/types/etalum";
import { viajes } from "@/lib/mock-data";

function generateId(): string {
  const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `VIA-${num}`;
}

export interface ViajeFilters {
  fecha?: string;
  ciudad?: string;
  vehiculoId?: string;
  conductorId?: string;
  estado?: Viaje["estado"];
}

export function useViajes() {
  const [data, setData] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setData([...viajes]);
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
    async (item: Omit<Viaje, "id">): Promise<Viaje> => {
      return new Promise<Viaje>((resolve) => {
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
    async (id: string, item: Partial<Viaje>): Promise<Viaje> => {
      return new Promise<Viaje>((resolve) => {
        setTimeout(() => {
          setData((prev) =>
            prev.map((d) => (d.id === id ? { ...d, ...item } : d))
          );
          resolve({ ...item, id } as Viaje);
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
    (filters: ViajeFilters): Viaje[] => {
      return data.filter((v) => {
        if (filters.fecha && v.fecha !== filters.fecha) return false;
        if (filters.ciudad && v.ciudadDestino !== filters.ciudad) return false;
        if (filters.vehiculoId && v.vehiculoId !== filters.vehiculoId)
          return false;
        if (filters.conductorId && v.conductorId !== filters.conductorId)
          return false;
        if (filters.estado && v.estado !== filters.estado) return false;
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
