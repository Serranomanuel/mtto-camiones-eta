"use client";

import { useState, useEffect, useCallback } from "react";
import { useConfiguracion } from "@/hooks/use-configuracion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LISTS_KEY = "etalum-listas";

const DEFAULT_LISTS: Record<string, string[]> = {
  ciudades: ["Bogotá", "Barranquilla", "Cartagena", "Santa Marta", "Bucaramanga"],
  areas: ["Ensamble", "Vidrio", "Almacén", "Aluminio", "Acero"],
  estadosDespacho: ["Programado", "En preparación", "Despachado", "Entregado", "Cancelado"],
  estadosViaje: ["Programado", "En ruta", "Completado", "Cancelado"],
  estadosVehiculo: ["Activo", "En taller", "Inactivo"],
  estadosConductor: ["Activo", "Inactivo", "Vacaciones", "Incapacidad"],
  tiposVehiculo: ["Camión turbo", "Camioneta", "Furgón", "Tractomula"],
  categoriasLicencia: ["B2", "B3", "C2", "C3"],
  categoriasPeaje: ["I", "II", "III", "IV", "V"],
  tiposCombustible: ["Diésel", "Gasolina corriente", "Gasolina extra"],
};

const LIST_LABELS: Record<string, string> = {
  ciudades: "Ciudades",
  areas: "Áreas",
  estadosDespacho: "Estados despacho",
  estadosViaje: "Estados viaje",
  estadosVehiculo: "Estados vehículo",
  estadosConductor: "Estados conductor",
  tiposVehiculo: "Tipos vehículo",
  categoriasLicencia: "Categorías licencia",
  categoriasPeaje: "Categorías peaje",
  tiposCombustible: "Tipos combustible",
};

function loadLists(): Record<string, string[]> {
  if (typeof window === "undefined") return structuredClone(DEFAULT_LISTS);
  try {
    const stored = localStorage.getItem(LISTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const merged: Record<string, string[]> = {};
      for (const key of Object.keys(DEFAULT_LISTS)) {
        merged[key] = Array.isArray(parsed[key]) ? parsed[key] : [...DEFAULT_LISTS[key]];
      }
      return merged;
    }
  } catch { /* fallback */ }
  return structuredClone(DEFAULT_LISTS);
}

function saveLists(lists: Record<string, string[]>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
  } catch { /* silently fail */ }
}

function EditableCell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-7 text-sm"
      />
    );
  }

  return (
    <span
      className="block cursor-pointer rounded px-1 hover:bg-muted/50"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value}
    </span>
  );
}

function ListManager({
  title,
  items,
  onChange,
}: {
  title: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed || items.includes(trimmed)) return;
    onChange([...items, trimmed]);
    setNewItem("");
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="font-medium text-sm">{title}</h3>
      <div className="flex gap-2">
        <Input
          placeholder={`Nuevo ${title.toLowerCase()}...`}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          className="h-7 text-sm"
        />
        <Button size="sm" variant="outline" onClick={addItem} disabled={!newItem.trim()}>
          Agregar
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
          >
            {item}
            <button
              className="ml-0.5 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(idx)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  const { data: parametros, loading, update } = useConfiguracion();
  const [lists, setLists] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setLists(loadLists());
  }, []);

  const updateList = useCallback((key: string, next: string[]) => {
    setLists((prev) => {
      const updated = { ...prev, [key]: next };
      saveLists(updated);
      return updated;
    });
  }, []);

  const handleParamUpdate = useCallback(
    async (parametro: string, valor: string) => {
      await update(parametro, valor);
    },
    [update]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <Tabs defaultValue="parametros">
        <TabsList>
          <TabsTrigger value="parametros">Parámetros Generales</TabsTrigger>
          <TabsTrigger value="listas">Listas Maestras</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="parametros" className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8">Cargando...</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Parámetro</th>
                    <th className="px-4 py-2 text-left font-medium">Valor</th>
                    <th className="px-4 py-2 text-left font-medium">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {parametros.map((p) => (
                    <tr key={p.parametro} className="border-b last:border-b-0">
                      <td className="px-4 py-2 font-medium">{p.parametro}</td>
                      <td className="px-4 py-2">
                        <EditableCell
                          value={p.valor}
                          onSave={(v) => handleParamUpdate(p.parametro, v)}
                        />
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{p.descripcion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="listas" className="mt-4 space-y-4">
          {Object.keys(DEFAULT_LISTS).map((key) => (
            <ListManager
              key={key}
              title={LIST_LABELS[key]}
              items={lists[key] ?? []}
              onChange={(next) => updateList(key, next)}
            />
          ))}
        </TabsContent>

        <TabsContent value="seguridad" className="mt-4">
          <div className="flex items-center justify-center rounded-lg border h-48 text-muted-foreground text-sm">
            Gestión de usuarios disponible en Fase 2
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
