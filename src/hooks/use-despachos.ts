"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Despacho } from "@/types/etalum";

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
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("despachos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setData((data || []).map(toCamelCase) as unknown as Despacho[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(
    async (item: Omit<Despacho, "id">): Promise<Despacho> => {
      const { data, error } = await supabase
        .from("despachos")
        .insert(toSnakeCase(item as Record<string, unknown>))
        .select()
        .single();
      if (error) throw error;
      const mapped = toCamelCase(data) as unknown as Despacho;
      setData((prev) => [...prev, mapped]);
      return mapped;
    },
    [supabase]
  );

  const update = useCallback(
    async (id: string, item: Partial<Despacho>): Promise<Despacho> => {
      const { data, error } = await supabase
        .from("despachos")
        .update(toSnakeCase(item as Record<string, unknown>))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      const mapped = toCamelCase(data) as unknown as Despacho;
      setData((prev) => prev.map((e) => (e.id === id ? mapped : e)));
      return mapped;
    },
    [supabase]
  );

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("despachos").delete().eq("id", id);
    if (error) throw error;
    setData((prev) => prev.filter((e) => e.id !== id));
  }, [supabase]);

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
      const { data, error } = await supabase
        .from("despachos")
        .update({ viaje_asignado_id: viajeId, estado: "Despachado" })
        .eq("id", despachoId)
        .select()
        .single();
      if (error) throw error;
      const mapped = toCamelCase(data) as unknown as Despacho;
      setData((prev) => prev.map((e) => (e.id === despachoId ? mapped : e)));
      return mapped;
    },
    [supabase]
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
