"use client";

import { useState, useEffect, useCallback } from "react";
import type { Despacho } from "@/types/etalum";
import { despachos } from "@/lib/mock-data";

function generateId(): string {
  const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `DES-${num}`;
}

export interface DespachoFilters {
  fecha?: string;
  ciudad?: string;
  clienteId?: string;
  estado?: Despacho["estado"];
  areaResponsable?: string;
}

export function useDespachos() {
  const [data, setData] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setData([...despachos]);
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
    async (item: Omit<Despacho, "id">): Promise<Despacho> => {
      return new Promise<Despacho>((resolve) => {
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
    async (id: string, item: Partial<Despacho>): Promise<Despacho> => {
      return new Promise<Despacho>((resolve) => {
        setTimeout(() => {
          setData((prev) =>
            prev.map((d) => (d.id === id ? { ...d, ...item } : d))
          );
          resolve({ ...item, id } as Despacho);
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
    (filters: DespachoFilters): Despacho[] => {
      return data.filter((d) => {
        if (filters.fecha && d.fecha !== filters.fecha) return false;
        if (filters.ciudad && d.ciudad !== filters.ciudad) return false;
        if (filters.clienteId && d.clienteId !== filters.clienteId) return false;
        if (filters.estado && d.estado !== filters.estado) return false;
        if (
          filters.areaResponsable &&
          d.areaResponsable !== filters.areaResponsable
        )
          return false;
        return true;
      });
    },
    [data]
  );

  const asignarViaje = useCallback(
    async (despachoId: string, viajeId: string): Promise<Despacho> => {
      return new Promise<Despacho>((resolve) => {
        setTimeout(() => {
          setData((prev) =>
            prev.map((d) =>
              d.id === despachoId
                ? { ...d, viajeAsignadoId: viajeId, estado: "Despachado" }
                : d
            )
          );
          const updated = data.find((d) => d.id === despachoId);
          resolve({
            ...updated,
            viajeAsignadoId: viajeId,
            estado: "Despachado",
          } as Despacho);
        }, 500);
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
    asignarViaje,
  };
}
