"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, Search } from "lucide-react";
import { useObras } from "@/hooks/use-obras";
import { useClientes } from "@/hooks/use-clientes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import type { Obra } from "@/types/etalum";

const CIUDADES = ["Bogotá", "Barranquilla", "Cartagena", "Santa Marta", "Bucaramanga"];

const initialForm: Omit<Obra, "id"> = {
  nombre: "",
  torre: "",
  clienteId: "",
  ciudad: "Bogotá",
  direccion: "",
  estadoDireccion: "Falta dirección",
  estadoObra: "Activa",
  fuente: "",
  alias: "",
  observaciones: "",
};

export default function ObrasPage() {
  const { data, loading, create, update, delete: remove } = useObras();
  const { data: clientes } = useClientes();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Obra, "id">>(initialForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCiudad, setFilterCiudad] = useState<string>("all");
  const [filterEstadoObra, setFilterEstadoObra] = useState<string>("all");

  const clienteMap = useMemo(() => {
    const map: Record<string, string> = {};
    clientes.forEach((c) => (map[c.id] = c.nombre));
    return map;
  }, [clientes]);

  const filtered = useMemo(() => {
    return data.filter((o) => {
      if (search && !o.nombre.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCiudad !== "all" && o.ciudad !== filterCiudad) return false;
      if (filterEstadoObra !== "all" && o.estadoObra !== filterEstadoObra) return false;
      return true;
    });
  }, [data, search, filterCiudad, filterEstadoObra]);

  const stats = useMemo(() => {
    const total = data.length;
    const activas = data.filter((o) => o.estadoObra === "Activa").length;
    const direccionPendiente = data.filter((o) => o.estadoDireccion === "Falta dirección").length;
    return { total, activas, direccionPendiente };
  }, [data]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (o: Obra) => {
    setEditingId(o.id);
    setForm({
      nombre: o.nombre,
      torre: o.torre,
      clienteId: o.clienteId,
      ciudad: o.ciudad,
      direccion: o.direccion,
      estadoDireccion: o.estadoDireccion,
      estadoObra: o.estadoObra,
      fuente: o.fuente,
      alias: o.alias,
      observaciones: o.observaciones,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (editingId) {
      await update(editingId, form);
    } else {
      await create(form);
    }
    setModalOpen(false);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await remove(deletingId);
    }
    setConfirmOpen(false);
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Obras</h1>
        </div>
        <SkeletonLoader variant="table-row" count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Obras</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-1" />
          Nueva Obra
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total obras</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Activas</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.activas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Dirección pendiente</p>
            <p className="text-2xl font-bold text-orange-600">{stats.direccionPendiente}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCiudad} onValueChange={(v) => v && setFilterCiudad(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Ciudad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ciudades</SelectItem>
            {CIUDADES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterEstadoObra} onValueChange={(v) => v && setFilterEstadoObra(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado obra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Activa">Activa</SelectItem>
            <SelectItem value="Finalizada">Finalizada</SelectItem>
            <SelectItem value="Suspendida">Suspendida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Torre</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Estado Dir.</TableHead>
              <TableHead>Estado Obra</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No se encontraron obras
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell className="font-medium">{o.nombre}</TableCell>
                  <TableCell>{o.torre}</TableCell>
                  <TableCell>{o.ciudad}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{o.direccion || "-"}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`size-2 rounded-full ${
                          o.estadoDireccion === "Completo" ? "bg-emerald-500" : "bg-orange-500"
                        }`}
                      />
                      <span className="text-xs">{o.estadoDireccion === "Completo" ? "Completo" : "Falta"}</span>
                    </span>
                  </TableCell>
                  <TableCell><StatusBadge status={o.estadoObra} /></TableCell>
                  <TableCell className="text-xs">{clienteMap[o.clienteId] || o.clienteId}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/obras/${o.id}`}>
                        <Button variant="ghost" size="icon-sm">
                          <Eye className="size-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(o)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDelete(o.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar obra" : "Nueva obra"}
        onSubmit={handleSave}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Torre</Label>
            <Input value={form.torre} onChange={(e) => setForm({ ...form, torre: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={form.clienteId} onValueChange={(val) => val && setForm({ ...form, clienteId: val })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ciudad</Label>
            <Select value={form.ciudad} onValueChange={(val) => setForm({ ...form, ciudad: val as Obra["ciudad"] })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CIUDADES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Dirección</Label>
            <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Estado dirección</Label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="estadoDireccion"
                  checked={form.estadoDireccion === "Completo"}
                  onChange={() => setForm({ ...form, estadoDireccion: "Completo" })}
                  className="accent-emerald-500"
                />
                Completo
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="estadoDireccion"
                  checked={form.estadoDireccion === "Falta dirección"}
                  onChange={() => setForm({ ...form, estadoDireccion: "Falta dirección" })}
                  className="accent-orange-500"
                />
                Falta dirección
              </label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Estado obra</Label>
            <Select value={form.estadoObra} onValueChange={(val) => setForm({ ...form, estadoObra: val as Obra["estadoObra"] })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Activa">Activa</SelectItem>
                <SelectItem value="Finalizada">Finalizada</SelectItem>
                <SelectItem value="Suspendida">Suspendida</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fuente</Label>
            <Input value={form.fuente} onChange={(e) => setForm({ ...form, fuente: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Alias</Label>
            <Input value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observaciones</Label>
            <Input value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={confirmOpen}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setDeletingId(null); }}
        title="Eliminar obra"
        description="¿Estás seguro de que deseas eliminar esta obra? Esta acción no se puede deshacer."
      />
    </div>
  );
}
