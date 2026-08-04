"use client";

import { useState, useEffect, useCallback } from "react";
import type { Cliente } from "@/types/etalum";
import { clientes } from "@/lib/mock-data";

function generateId(): string {
  const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `CLI-${num}`;
}

export function useClientes() {
  const [data, setData] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setData([...clientes]);
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
    async (item: Omit<Cliente, "id">): Promise<Cliente> => {
      return new Promise<Cliente>((resolve) => {
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
    async (id: string, item: Partial<Cliente>): Promise<Cliente> => {
      return new Promise<Cliente>((resolve) => {
        setTimeout(() => {
          setData((prev) =>
            prev.map((d) => (d.id === id ? { ...d, ...item } : d))
          );
          resolve({ ...item, id } as Cliente);
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
