"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Parametro } from "@/types/etalum";

function toCamelCase(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
}

export function useConfiguracion() {
  const [data, setData] = useState<Parametro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("parametros")
      .select("*")
      .order("parametro", { ascending: true });

    if (error) setError(error.message);
    else setData((data || []).map(toCamelCase) as unknown as Parametro[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const update = useCallback(
    async (parametro: string, valor: string): Promise<Parametro> => {
      const { data: existing } = await supabase
        .from("parametros")
        .select("parametro")
        .eq("parametro", parametro)
        .single();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from("parametros")
          .update({ valor })
          .eq("parametro", parametro)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from("parametros")
          .insert({ parametro, valor, descripcion: "" })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }
      const mapped = toCamelCase(result) as unknown as Parametro;
      setData((prev) => {
        const exists = prev.find((p) => p.parametro === parametro);
        if (exists) {
          return prev.map((p) => (p.parametro === parametro ? mapped : p));
        }
        return [...prev, mapped];
      });
      return mapped;
    },
    [supabase]
  );

  const reset = useCallback(async (): Promise<void> => {
    const { error } = await supabase.from("parametros").delete().neq("parametro", "");
    if (error) throw error;
    const defaults = [
      { parametro: "Moneda", valor: "COP", descripcion: "Moneda del sistema" },
      { parametro: "Año vigente", valor: "2026", descripcion: "Año fiscal en curso" },
      { parametro: "Precio combustible referencia", valor: "14250", descripcion: "Precio de referencia del galón de diésel en COP" },
      { parametro: "Google Maps API Key", valor: "[PROXIMAMENTE]", descripcion: "API Key para integración con Google Maps" },
      { parametro: "Nombre empresa", valor: "ETALUM S.A.S.", descripcion: "Nombre comercial de la empresa" },
    ];
    const { data, error: insertError } = await supabase
      .from("parametros")
      .insert(defaults)
      .select();
    if (insertError) throw insertError;
    setData((data || []).map(toCamelCase) as unknown as Parametro[]);
  }, [supabase]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    update,
    reset,
  };
}
