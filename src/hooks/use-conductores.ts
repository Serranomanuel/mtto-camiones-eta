"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conductor } from "@/types/etalum";
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

export function useConductores() {
  const [data, setData] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("conductores")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setData((data || []).map(toCamelCase) as unknown as Conductor[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(
    async (item: Omit<Conductor, "id">): Promise<Conductor> => {
      const { data, error } = await supabase
        .from("conductores")
        .insert(withGeneratedId(toSnakeCase(item as Record<string, unknown>)))
        .select()
        .single();
      if (error) throw error;
      const mapped = toCamelCase(data) as unknown as Conductor;
      setData((prev) => [...prev, mapped]);
      return mapped;
    },
    [supabase]
  );

  const update = useCallback(
    async (id: string, item: Partial<Conductor>): Promise<Conductor> => {
      const { data, error } = await supabase
        .from("conductores")
        .update(toSnakeCase(item as Record<string, unknown>))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      const mapped = toCamelCase(data) as unknown as Conductor;
      setData((prev) => prev.map((e) => (e.id === id ? mapped : e)));
      return mapped;
    },
    [supabase]
  );

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("conductores").delete().eq("id", id);
    if (error) throw error;
    setData((prev) => prev.filter((e) => e.id !== id));
  }, [supabase]);

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
