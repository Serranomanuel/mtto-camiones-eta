"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useConductores } from "@/hooks/use-conductores";
import { useVehiculos } from "@/hooks/use-vehiculos";
import type { Conductor } from "@/types/etalum";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import {
  Plus,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function diasParaVencer(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fecha);
  venc.setHours(0, 0, 0, 0);
  return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function estaPorVencer(fecha: string): boolean {
  const dias = diasParaVencer(fecha);
  return dias >= 0 && dias < 30;
}

function formatoFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const emptyForm: Omit<Conductor, "id"> = {
  nombreCompleto: "",
  cedula: "",
  categoriaLicencia: "B2",
  licenciaVencimiento: "",
  telefono: "",
  ciudadBase: "",
  estado: "Activo",
  vehiculoAsignadoId: null,
  placaAsignada: null,
  fechaIngreso: "",
  observaciones: "",
};

export default function ConductoresPage() {
  const { data: conductores, loading, create, update, delete: deleteConductor } = useConductores();
  const { data: vehiculos } = useVehiculos();

  const [view, setView] = useState<"cards" | "table">("cards");
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Conductor, "id">>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Conductor | null>(null);

  const filtered = useMemo(() => {
    return conductores.filter((c) => {
      const matchSearch =
        c.nombreCompleto.toLowerCase().includes(search.toLowerCase()) ||
        c.cedula.includes(search) ||
        c.telefono.includes(search);
      const matchEstado = filterEstado === "Todos" || c.estado === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [conductores, search, filterEstado]);

  const vehiculosActivos = vehiculos.filter((v) => v.estado === "Activo");

  function getVehiculoPlaca(id: string | null): string {
    if (!id) return "Sin asignar";
    const v = vehiculos.find((veh) => veh.id === id);
    return v ? v.placa : "Sin asignar";
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(c: Conductor) {
    setEditingId(c.id);
    setForm({
      nombreCompleto: c.nombreCompleto,
      cedula: c.cedula,
      categoriaLicencia: c.categoriaLicencia,
      licenciaVencimiento: c.licenciaVencimiento,
      telefono: c.telefono,
      ciudadBase: c.ciudadBase,
      estado: c.estado,
      vehiculoAsignadoId: c.vehiculoAsignadoId,
      placaAsignada: c.placaAsignada,
      fechaIngreso: c.fechaIngreso,
      observaciones: c.observaciones,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (editingId) {
      await update(editingId, form);
    } else {
      await create(form);
    }
    setModalOpen(false);
  }

  async function handleDelete() {
    if (deleteTarget) {
      await deleteConductor(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  function setField<K extends keyof Omit<Conductor, "id">>(
    key: K,
    value: Omit<Conductor, "id">[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "vehiculoAsignadoId") {
        const veh = vehiculos.find((v) => v.id === value);
        next.placaAsignada = veh ? veh.placa : null;
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <SkeletonLoader count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conductores</h1>
          <p className="text-muted-foreground">
            {filtered.length} conductor{filtered.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Conductor
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nombre, cédula o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={filterEstado} onValueChange={(v) => v && setFilterEstado(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Activo">Activo</SelectItem>
            <SelectItem value="Inactivo">Inactivo</SelectItem>
            <SelectItem value="Vacaciones">Vacaciones</SelectItem>
            <SelectItem value="Incapacidad">Incapacidad</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant={view === "cards" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "table" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No se encontraron conductores</p>
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const dias = diasParaVencer(c.licenciaVencimiento);
            const alerta = estaPorVencer(c.licenciaVencimiento);
            return (
              <Card
                key={c.id}
                className={`transition-shadow hover:shadow-md ${
                  alerta ? "border-orange-400 ring-orange-200 dark:border-orange-600" : ""
                }`}
              >
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(c.nombreCompleto)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          href={`/conductores/${c.id}`}
                          className="font-medium hover:underline"
                        >
                          {c.nombreCompleto}
                        </Link>
                        <p className="text-xs text-muted-foreground">{c.cedula}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteTarget(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{c.categoriaLicencia}</Badge>
                    <StatusBadge status={c.estado} />
                    {alerta && (
                      <Badge
                        variant="outline"
                        className="border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-950 dark:text-orange-400"
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {dias < 0
                          ? `Vencida hace ${Math.abs(dias)}d`
                          : dias === 0
                            ? "Vence hoy"
                            : `${dias}d para vencer`}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <span>Tel: {c.telefono}</span>
                    <span>Ciudad: {c.ciudadBase}</span>
                    <span>Licencia: {formatoFecha(c.licenciaVencimiento)}</span>
                    <span>Vehículo: {getVehiculoPlaca(c.vehiculoAsignadoId)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conductor</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Licencia</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const alerta = estaPorVencer(c.licenciaVencimiento);
                return (
                  <TableRow
                    key={c.id}
                    className={alerta ? "bg-orange-50/50 dark:bg-orange-950/20" : ""}
                  >
                    <TableCell>
                      <Link
                        href={`/conductores/${c.id}`}
                        className="font-medium hover:underline"
                      >
                        {c.nombreCompleto}
                      </Link>
                    </TableCell>
                    <TableCell>{c.cedula}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.categoriaLicencia}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={alerta ? "font-semibold text-orange-600 dark:text-orange-400" : ""}>
                        {formatoFecha(c.licenciaVencimiento)}
                      </span>
                    </TableCell>
                    <TableCell>{c.telefono}</TableCell>
                    <TableCell>{getVehiculoPlaca(c.vehiculoAsignadoId)}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.estado} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Conductor" : "Nuevo Conductor"}
        onSubmit={handleSave}
        submitLabel={editingId ? "Actualizar" : "Crear"}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombreCompleto">Nombre completo</Label>
            <Input
              id="nombreCompleto"
              value={form.nombreCompleto}
              onChange={(e) => setField("nombreCompleto", e.target.value)}
              placeholder="Nombre y apellidos"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula</Label>
              <Input
                id="cedula"
                value={form.cedula}
                onChange={(e) => setField("cedula", e.target.value)}
                placeholder="Ej: 1.234.567"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={form.telefono}
                onChange={(e) => setField("telefono", e.target.value)}
                placeholder="Ej: 3001234567"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría licencia</Label>
              <Select
                value={form.categoriaLicencia}
                onValueChange={(v) => setField("categoriaLicencia", v as Conductor["categoriaLicencia"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2">B2</SelectItem>
                  <SelectItem value="B3">B3</SelectItem>
                  <SelectItem value="C2">C2</SelectItem>
                  <SelectItem value="C3">C3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vencimiento licencia</Label>
              <Input
                type="date"
                value={form.licenciaVencimiento}
                onChange={(e) => setField("licenciaVencimiento", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ciudad base</Label>
              <Input
                value={form.ciudadBase}
                onChange={(e) => setField("ciudadBase", e.target.value)}
                placeholder="Ej: Bucaramanga"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de ingreso</Label>
              <Input
                type="date"
                value={form.fechaIngreso}
                onChange={(e) => setField("fechaIngreso", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={form.estado}
                onValueChange={(v) => setField("estado", v as Conductor["estado"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                  <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                  <SelectItem value="Incapacidad">Incapacidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehículo asignado</Label>
              <Select
                value={form.vehiculoAsignadoId ?? "__none__"}
                onValueChange={(v) =>
                  setField(
                    "vehiculoAsignadoId",
                    v === "__none__" ? null : v
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin asignar</SelectItem>
                  {vehiculosActivos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.placa} — {v.marca} {v.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Input
              value={form.observaciones}
              onChange={(e) => setField("observaciones", e.target.value)}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar conductor"
        description={`¿Estás seguro de eliminar a ${deleteTarget?.nombreCompleto}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
