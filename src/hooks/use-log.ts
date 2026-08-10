"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LogEntry } from "@/types/etalum";

function toCamelCase(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
}

export function useLog() {
  const [data, setData] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("log_auditoria")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setData((data || []).map(toCamelCase) as unknown as LogEntry[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const registrar = useCallback(
    async (
      accion: LogEntry["accion"],
      modulo: string,
      idRegistro: string,
      detalle: string
    ): Promise<void> => {
      const { error } = await supabase.from("log_auditoria").insert({
        fecha_hora: new Date().toISOString(),
        usuario: "admin",
        modulo,
        accion,
        id_registro: idRegistro,
        campo_modificado: "",
        valor_anterior: "",
        valor_nuevo: "",
        detalle,
      });
      if (error) throw error;
      await fetchData();
    },
    [supabase, fetchData]
  );

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    registrar,
  };
}
