"use client";

import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Pencil, Trash2, Search, Landmark } from "lucide-react";
import { usePeajes } from "@/hooks/use-peajes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { KpiCard } from "@/components/shared/KpiCard";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import type { Peaje } from "@/types/etalum";

const formatCOP = (value: number) =>
  `$${value.toLocaleString("es-CO")}`;

const categorias = [
  "Categoría I",
  "Categoría II",
  "Categoría III",
  "Categoría IV",
  "Categoría V",
];

const departamentos = ["Santander", "Cundinamarca", "Atlántico"];

const initialForm: Omit<Peaje, "id"> = {
  nombre: "",
  via: "",
  departamento: "",
  categoriaVehiculo: "Categoría I",
  tarifa: 0,
  fechaActualizacion: new Date().toISOString().split("T")[0],
  fuente: "",
  observaciones: "",
};

export default function PeajesPage() {
  const { data, loading, create, update, delete: remove } = usePeajes();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Peaje, "id">>(initialForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filterDepartamento, setFilterDepartamento] = useState("all");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (filterDepartamento !== "all" && item.departamento !== filterDepartamento)
        return false;
      if (filterCategoria !== "all" && item.categoriaVehiculo !== filterCategoria)
        return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          item.nombre.toLowerCase().includes(q) ||
          item.via.toLowerCase().includes(q) ||
          item.departamento.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [data, filterDepartamento, filterCategoria, search]);

  const statsPorCategoria = useMemo(() => {
    const map = new Map<string, number[]>();
    data.forEach((p) => {
      const arr = map.get(p.categoriaVehiculo) || [];
      arr.push(p.tarifa);
      map.set(p.categoriaVehiculo, arr);
    });
    const result: { categoria: string; promedio: number }[] = [];
    map.forEach((tarifas, categoria) => {
      const promedio = Math.round(
        tarifas.reduce((a, b) => a + b, 0) / tarifas.length
      );
      result.push({ categoria, promedio });
    });
    return result.sort((a, b) => a.categoria.localeCompare(b.categoria));
  }, [data]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (p: Peaje) => {
    setEditingId(p.id);
    setForm({
      nombre: p.nombre,
      via: p.via,
      departamento: p.departamento,
      categoriaVehiculo: p.categoriaVehiculo,
      tarifa: p.tarifa,
      fechaActualizacion: p.fechaActualizacion,
      fuente: p.fuente,
      observaciones: p.observaciones,
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
          <h1 className="text-2xl font-bold">Peajes</h1>
        </div>
        <SkeletonLoader variant="card" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Peajes</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-1" />
          Nuevo peaje
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {statsPorCategoria.map((s) => (
          <KpiCard
            key={s.categoria}
            title={s.categoria}
            value={formatCOP(s.promedio)}
            icon={Landmark}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nombre, vía o departamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select
              value={filterDepartamento}
              onValueChange={(v) => setFilterDepartamento(v ?? "all")}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {departamentos.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategoria} onValueChange={(v) => setFilterCategoria(v ?? "all")}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Peajes ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Vía</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tarifa</TableHead>
                  <TableHead>Actualización</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No se encontraron peajes
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.via}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.departamento}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.categoriaVehiculo}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCOP(p.tarifa)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(parseISO(p.fechaActualizacion), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openDelete(p.id)}
                          >
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
        </CardContent>
      </Card>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar peaje" : "Nuevo peaje"}
        onSubmit={handleSave}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Peaje Piedecuestas"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Vía</Label>
            <Input
              value={form.via}
              onChange={(e) => setForm({ ...form, via: e.target.value })}
              placeholder="Ej: Vía Bucaramanga-Piedecuesta"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Departamento</Label>
            <Input
              value={form.departamento}
              onChange={(e) =>
                setForm({ ...form, departamento: e.target.value })
              }
              placeholder="Ej: Santander"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Categoría vehículo</Label>
            <Select
              value={form.categoriaVehiculo}
              onValueChange={(val) =>
                setForm({
                  ...form,
                  categoriaVehiculo: (val ?? "Categoría I") as Peaje["categoriaVehiculo"],
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tarifa (COP)</Label>
            <Input
              type="number"
              value={form.tarifa}
              onChange={(e) =>
                setForm({ ...form, tarifa: Number(e.target.value) })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fecha actualización</Label>
            <Input
              type="date"
              value={form.fechaActualizacion}
              onChange={(e) =>
                setForm({ ...form, fechaActualizacion: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fuente</Label>
            <Input
              value={form.fuente}
              onChange={(e) => setForm({ ...form, fuente: e.target.value })}
              placeholder="Ej: ANI"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observaciones</Label>
            <Input
              value={form.observaciones}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
              }
            />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={confirmOpen}
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeletingId(null);
        }}
        title="Eliminar peaje"
        description="¿Estás seguro de que deseas eliminar este peaje? Esta acción no se puede deshacer."
      />
    </div>
  );
}
