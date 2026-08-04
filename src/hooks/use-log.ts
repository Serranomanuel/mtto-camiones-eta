"use client";

import { useState, useEffect, useCallback } from "react";
import type { LogEntry } from "@/types/etalum";
import { useAppStore } from "@/store/use-store";

export function useLog() {
  const logs = useAppStore((state) => state.logs);
  const addLog = useAppStore((state) => state.addLog);

  const [data, setData] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setData([...logs]);
      } catch {
        setError("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }, 800);
  }, [logs]);

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
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          addLog({
            usuario: "admin",
            modulo,
            accion,
            idRegistro,
            campoModificado: "",
            valorAnterior: "",
            valorNuevo: "",
            detalle,
          });
          resolve();
        }, 300);
      });
    },
    [addLog]
  );

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    registrar,
  };
}
