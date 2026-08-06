"use client";

import { useState, useEffect, useCallback } from "react";
import { useConfiguracion } from "@/hooks/use-configuracion";
import { useUsuarios } from "@/hooks/use-usuarios";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import type { Usuario } from "@/types/etalum";
import { toast } from "sonner";

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

type UsuarioForm = Omit<Usuario, "id" | "fechaCreacion" | "ultimoAcceso">;

const EMPTY_FORM: UsuarioForm = {
  nombre: "",
  email: "",
  rol: "Visual",
  estado: "Activo",
};

export default function ConfiguracionPage() {
  const { data: parametros, loading, update } = useConfiguracion();
  const { data: usuarios, loading: loadingUsuarios, create, update: updateUsuario, delete: deleteUsuario } = useUsuarios();
  const [lists, setLists] = useState<Record<string, string[]>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [form, setForm] = useState<UsuarioForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<Usuario | null>(null);

  const [filterRol, setFilterRol] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

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

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (user: Usuario) => {
    setEditingUser(user);
    setForm({
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      estado: user.estado,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.email.trim()) {
      toast.error("Nombre y email son obligatorios");
      return;
    }
    setSaving(true);
    try {
      if (editingUser) {
        await updateUsuario(editingUser.id, form);
        toast.success("Usuario actualizado");
      } else {
        await create(form);
        toast.success("Usuario creado");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    await deleteUsuario(deletingUser.id);
    setDeleteDialogOpen(false);
    setDeletingUser(null);
    toast.success("Usuario eliminado");
  };

  const filteredUsuarios = usuarios.filter((u) => {
    if (filterRol !== "todos" && u.rol !== filterRol) return false;
    if (filterEstado !== "todos" && u.estado !== filterEstado) return false;
    return true;
  });

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

        <TabsContent value="seguridad" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Gestión de Usuarios</h2>
              <p className="text-sm text-muted-foreground">Administra los usuarios del sistema</p>
            </div>
            <Button size="sm" onClick={openCreateModal}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={filterRol} onValueChange={(v) => v && setFilterRol(v)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Editor">Editor</SelectItem>
                <SelectItem value="Visual">Visual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={(v) => v && setFilterEstado(v)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingUsuarios ? (
            <SkeletonLoader variant="table-row" count={5} />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">ID</th>
                    <th className="px-4 py-2 text-left font-medium">Nombre</th>
                    <th className="px-4 py-2 text-left font-medium">Email</th>
                    <th className="px-4 py-2 text-left font-medium">Rol</th>
                    <th className="px-4 py-2 text-left font-medium">Estado</th>
                    <th className="px-4 py-2 text-left font-medium">Último Acceso</th>
                    <th className="px-4 py-2 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  ) : (
                    filteredUsuarios.map((u) => (
                      <tr key={u.id} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="px-4 py-2 font-mono text-xs">{u.id}</td>
                        <td className="px-4 py-2 font-medium">{u.nombre}</td>
                        <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-2"><StatusBadge status={u.rol} /></td>
                        <td className="px-4 py-2"><StatusBadge status={u.estado} /></td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">{u.ultimoAcceso}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditModal(u)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => { setDeletingUser(u); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {filteredUsuarios.length} usuario{filteredUsuarios.length !== 1 ? "s" : ""} encontrado{filteredUsuarios.length !== 1 ? "s" : ""}
          </p>
        </TabsContent>
      </Tabs>

      <FormModal
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input
              id="nombre"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Carlos Mendoza"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Ej: carlos@etalum.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={form.rol} onValueChange={(v) => v && setForm((f) => ({ ...f, rol: v as Usuario["rol"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Editor">Editor</SelectItem>
                  <SelectItem value="Visual">Visual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => v && setForm((f) => ({ ...f, estado: v as Usuario["estado"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        title="Eliminar Usuario"
        description={`¿Estás seguro de eliminar a "${deletingUser?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
