"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Combustible } from "@/types/etalum";
import { withGeneratedId } from "@/lib/supabase/records";

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

export function useCombustible() {
  const [data, setData] = useState<Combustible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("combustible")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setData((data || []).map(toCamelCase) as unknown as Combustible[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(
    async (item: Omit<Combustible, "id">): Promise<Combustible> => {
      const { data, error } = await supabase
        .from("combustible")
        .insert(withGeneratedId(toSnakeCase(item as Record<string, unknown>)))
        .select()
        .single();
      if (error) throw error;
      const mapped = toCamelCase(data) as unknown as Combustible;
      setData((prev) => [...prev, mapped]);
      return mapped;
    },
    [supabase]
  );

  const update = useCallback(
    async (id: string, item: Partial<Combustible>): Promise<Combustible> => {
      const { data, error } = await supabase
        .from("combustible")
        .update(toSnakeCase(item as Record<string, unknown>))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      const mapped = toCamelCase(data) as unknown as Combustible;
      setData((prev) => prev.map((e) => (e.id === id ? mapped : e)));
      return mapped;
    },
    [supabase]
  );

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("combustible").delete().eq("id", id);
    if (error) throw error;
    setData((prev) => prev.filter((e) => e.id !== id));
  }, [supabase]);

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
