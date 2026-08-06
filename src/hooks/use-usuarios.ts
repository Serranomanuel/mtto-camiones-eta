"use client";

import { useState, useEffect, useCallback } from "react";
import type { Usuario } from "@/types/etalum";

const STORAGE_KEY = "etalum-usuarios";

const DEFAULT_USUARIOS: Usuario[] = [
  {
    id: "USR-01",
    nombre: "Carlos Mendoza",
    email: "carlos.mendoza@etalum.com",
    rol: "Admin",
    estado: "Activo",
    fechaCreacion: "2025-01-15",
    ultimoAcceso: "2026-08-06",
  },
  {
    id: "USR-02",
    nombre: "Laura García",
    email: "laura.garcia@etalum.com",
    rol: "Editor",
    estado: "Activo",
    fechaCreacion: "2025-03-20",
    ultimoAcceso: "2026-08-05",
  },
  {
    id: "USR-03",
    nombre: "Pedro Ramírez",
    email: "pedro.ramirez@etalum.com",
    rol: "Visual",
    estado: "Activo",
    fechaCreacion: "2025-06-10",
    ultimoAcceso: "2026-08-04",
  },
  {
    id: "USR-04",
    nombre: "Ana López",
    email: "ana.lopez@etalum.com",
    rol: "Editor",
    estado: "Inactivo",
    fechaCreacion: "2025-08-01",
    ultimoAcceso: "2026-06-15",
  },
  {
    id: "USR-05",
    nombre: "Miguel Torres",
    email: "miguel.torres@etalum.com",
    rol: "Visual",
    estado: "Activo",
    fechaCreacion: "2026-01-10",
    ultimoAcceso: "2026-08-01",
  },
];

function generateId(): string {
  const num = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
  return `USR-${num}`;
}

function loadFromStorage(): Usuario[] {
  if (typeof window === "undefined") return [...DEFAULT_USUARIOS];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* fallback */ }
  return [...DEFAULT_USUARIOS];
}

function saveToStorage(usuarios: Usuario[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
  } catch { /* silently fail */ }
}

export function useUsuarios() {
  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      try {
        setData(loadFromStorage());
      } catch {
        setError("Error al cargar usuarios");
      } finally {
        setLoading(false);
      }
    }, 800);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(
    async (item: Omit<Usuario, "id" | "fechaCreacion" | "ultimoAcceso">): Promise<Usuario> => {
      return new Promise<Usuario>((resolve) => {
        setTimeout(() => {
          const now = new Date().toISOString().split("T")[0];
          const newItem: Usuario = {
            ...item,
            id: generateId(),
            fechaCreacion: now,
            ultimoAcceso: now,
          };
          setData((prev) => {
            const next = [...prev, newItem];
            saveToStorage(next);
            return next;
          });
          resolve(newItem);
        }, 500);
      });
    },
    []
  );

  const update = useCallback(
    async (id: string, item: Partial<Usuario>): Promise<Usuario> => {
      return new Promise<Usuario>((resolve) => {
        setTimeout(() => {
          setData((prev) => {
            const next = prev.map((u) => (u.id === id ? { ...u, ...item } : u));
            saveToStorage(next);
            return next;
          });
          resolve({ ...item, id } as Usuario);
        }, 500);
      });
    },
    []
  );

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setData((prev) => {
          const next = prev.filter((u) => u.id !== id);
          saveToStorage(next);
          return next;
        });
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
