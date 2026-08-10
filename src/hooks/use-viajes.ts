"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Viaje } from "@/types/etalum";

function toCamelCase(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
}

function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
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
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("viajes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setData((data || []).map(toCamelCase) as unknown as Viaje[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(
    async (item: Omit<Viaje, "id">): Promise<Viaje> => {
      const { data, error } = await supabase
        .from("viajes")
        .insert(toSnakeCase(item as Record<string, unknown>))
        .select()
        .single();
      if (error) throw error;
      const mapped = toCamelCase(data) as unknown as Viaje;
      setData((prev) => [...prev, mapped]);
      return mapped;
    },
    [supabase]
  );

  const update = useCallback(
    async (id: string, item: Partial<Viaje>): Promise<Viaje> => {
      const { data, error } = await supabase
        .from("viajes")
        .update(toSnakeCase(item as Record<string, unknown>))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      const mapped = toCamelCase(data) as unknown as Viaje;
      setData((prev) => prev.map((e) => (e.id === id ? mapped : e)));
      return mapped;
    },
    [supabase]
  );

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("viajes").delete().eq("id", id);
    if (error) throw error;
    setData((prev) => prev.filter((e) => e.id !== id));
  }, [supabase]);

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
