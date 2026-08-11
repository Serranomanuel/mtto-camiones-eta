"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Usuario } from "@/types/etalum";
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

export function useUsuarios() {
  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setData((data || []).map(toCamelCase) as unknown as Usuario[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(
    async (item: Omit<Usuario, "id" | "fechaCreacion" | "ultimoAcceso">): Promise<Usuario> => {
      const now = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("usuarios")
        .insert(
          withGeneratedId(toSnakeCase({
            ...item,
            fechaCreacion: now,
            ultimoAcceso: now,
          } as Record<string, unknown>))
        )
        .select()
        .single();
      if (error) throw error;
      const mapped = toCamelCase(data) as unknown as Usuario;
      setData((prev) => [...prev, mapped]);
      return mapped;
    },
    [supabase]
  );

  const update = useCallback(
    async (id: string, item: Partial<Usuario>): Promise<Usuario> => {
      const { data, error } = await supabase
        .from("usuarios")
        .update(toSnakeCase(item as Record<string, unknown>))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      const mapped = toCamelCase(data) as unknown as Usuario;
      setData((prev) => prev.map((e) => (e.id === id ? mapped : e)));
      return mapped;
    },
    [supabase]
  );

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("usuarios").delete().eq("id", id);
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
