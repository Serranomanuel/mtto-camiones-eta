"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useClientes } from "@/hooks/use-clientes";
import { useObras } from "@/hooks/use-obras";
import type { Cliente } from "@/types/etalum";
import { clienteSchema, type ClienteFormData } from "@/lib/validations";
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
  Building2,
} from "lucide-react";

export default function ClientesPage() {
  const { data: clientes, loading, create, update, delete: deleteCliente } = useClientes();
  const { data: obras } = useObras();

  const [view, setView] = useState<"cards" | "table">("table");
  const [search, setSearch] = useState("");
  const [filterCiudad, setFilterCiudad] = useState<string>("Todas");
  const [filterEstado, setFilterEstado] = useState<string>("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema) as Resolver<ClienteFormData>,
    defaultValues: {
      nombre: "",
      nit: "",
      contacto: "",
      telefono: "",
      email: "",
      ciudad: "",
      estado: "Activa",
      observaciones: "",
    },
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isValid } } = form;

  const ciudades = useMemo(() => {
    const unique = [...new Set(clientes.map((c) => c.ciudad).filter(Boolean))];
    return unique.sort();
  }, [clientes]);

  const calcularObrasActivas = (clienteId: string): number => {
    return obras.filter((o) => o.clienteId === clienteId && o.estadoObra === "Activa").length;
  };

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      const matchSearch =
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.nit.includes(search) ||
        c.contacto.toLowerCase().includes(search.toLowerCase());
      const matchCiudad = filterCiudad === "Todas" || c.ciudad === filterCiudad;
      const matchEstado = filterEstado === "Todos" || c.estado === filterEstado;
      return matchSearch && matchCiudad && matchEstado;
    });
  }, [clientes, search, filterCiudad, filterEstado]);

  function openCreate() {
    setEditingId(null);
    reset({
      nombre: "",
      nit: "",
      contacto: "",
      telefono: "",
      email: "",
      ciudad: "",
      estado: "Activa",
      observaciones: "",
    });
    setModalOpen(true);
  }

  function openEdit(c: Cliente) {
    setEditingId(c.id);
    reset({
      nombre: c.nombre,
      nit: c.nit,
      contacto: c.contacto,
      telefono: c.telefono,
      email: c.email,
      ciudad: c.ciudad,
      estado: c.estado,
      observaciones: c.observaciones,
    });
    setModalOpen(true);
  }

  async function onValid(data: ClienteFormData) {
    if (editingId) {
      await update(editingId, data as Partial<Cliente>);
    } else {
      await create({ ...data, obrasActivas: 0 } as Omit<Cliente, "id">);
    }
    setModalOpen(false);
  }

  async function handleDelete() {
    if (deleteTarget) {
      await deleteCliente(deleteTarget.id);
      setDeleteTarget(null);
    }
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
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nombre, NIT o contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={filterCiudad} onValueChange={(v) => v && setFilterCiudad(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Ciudad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas</SelectItem>
            {ciudades.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterEstado} onValueChange={(v) => v && setFilterEstado(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Activa">Activa</SelectItem>
            <SelectItem value="Inactiva">Inactiva</SelectItem>
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
          <p className="text-muted-foreground">No se encontraron clientes</p>
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="transition-shadow hover:shadow-md">
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/clientes/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.nombre}
                    </Link>
                    <p className="text-xs text-muted-foreground">NIT: {c.nit}</p>
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
                  <StatusBadge status={c.estado} />
                  <Badge variant="outline" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    {calcularObrasActivas(c.id)} obras activas
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>Contacto: {c.contacto}</span>
                  <span>Tel: {c.telefono}</span>
                  <span>Email: {c.email}</span>
                  <span>Ciudad: {c.ciudad}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Obras Activas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/clientes/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/clientes/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.nombre}
                    </Link>
                  </TableCell>
                  <TableCell>{c.nit}</TableCell>
                  <TableCell>{c.contacto}</TableCell>
                  <TableCell>{c.telefono}</TableCell>
                  <TableCell>{c.ciudad}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Building2 className="h-3 w-3" />
                      {calcularObrasActivas(c.id)}
                    </Badge>
                  </TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Cliente" : "Nuevo Cliente"}
        onSubmit={handleSubmit(onValid)}
        submitLabel={editingId ? "Actualizar" : "Crear"}
        disabled={!isValid}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              {...register("nombre")}
              placeholder="Nombre del cliente"
              className={errors.nombre ? "border-destructive" : ""}
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nit">NIT</Label>
              <Input
                id="nit"
                {...register("nit")}
                placeholder="Ej: 900123456-7"
                className={errors.nit ? "border-destructive" : ""}
              />
              {errors.nit && (
                <p className="text-sm text-destructive">{errors.nit.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                {...register("ciudad")}
                placeholder="Ej: Bucaramanga"
                className={errors.ciudad ? "border-destructive" : ""}
              />
              {errors.ciudad && (
                <p className="text-sm text-destructive">{errors.ciudad.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contacto">Contacto</Label>
              <Input
                id="contacto"
                {...register("contacto")}
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                {...register("telefono")}
                placeholder="Ej: 3001234567"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="correo@ejemplo.com"
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={watch("estado")}
              onValueChange={(v) => v && setValue("estado", v as Cliente["estado"], { shouldValidate: true })}
            >
              <SelectTrigger className={errors.estado ? "border-destructive" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Activa">Activa</SelectItem>
                <SelectItem value="Inactiva">Inactiva</SelectItem>
              </SelectContent>
            </Select>
            {errors.estado && (
              <p className="text-sm text-destructive">{errors.estado.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Input
              {...register("observaciones")}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar cliente"
        description={`¿Estás seguro de eliminar a ${deleteTarget?.nombre}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
