"use client";

import { useState, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { peajeSchema, type PeajeFormData } from "@/lib/validations";
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

const initialForm: PeajeFormData = {
  nombre: "",
  via: "",
  departamento: "",
  categoriaVehiculo: "Categoría I",
  tarifa: 0,
  fuente: "",
  observaciones: "",
};

export default function PeajesPage() {
  const { data, loading, create, update, delete: remove } = usePeajes();

  const form = useForm<PeajeFormData>({
    resolver: zodResolver(peajeSchema) as Resolver<PeajeFormData>,
    defaultValues: initialForm,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    form.reset(initialForm);
    setModalOpen(true);
  };

  const openEdit = (p: Peaje) => {
    setEditingId(p.id);
    form.reset({
      nombre: p.nombre,
      via: p.via,
      departamento: p.departamento,
      categoriaVehiculo: p.categoriaVehiculo,
      tarifa: p.tarifa,
      fuente: p.fuente,
      observaciones: p.observaciones,
    });
    setModalOpen(true);
  };

  const onValid = async (data: PeajeFormData) => {
    if (editingId) {
      await update(editingId, { ...data, fechaActualizacion: new Date().toISOString().split("T")[0] } as Partial<Peaje>);
    } else {
      await create({ ...data, fechaActualizacion: new Date().toISOString().split("T")[0] } as Omit<Peaje, "id">);
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
        onSubmit={form.handleSubmit(onValid)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              {...form.register("nombre")}
              className={form.formState.errors.nombre ? "border-destructive" : ""}
              placeholder="Ej: Peaje Piedecuestas"
            />
            {form.formState.errors.nombre?.message && (
              <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Vía</Label>
            <Input
              {...form.register("via")}
              className={form.formState.errors.via ? "border-destructive" : ""}
              placeholder="Ej: Vía Bucaramanga-Piedecuesta"
            />
            {form.formState.errors.via?.message && (
              <p className="text-sm text-destructive">{form.formState.errors.via.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Departamento</Label>
            <Input
              {...form.register("departamento")}
              className={form.formState.errors.departamento ? "border-destructive" : ""}
              placeholder="Ej: Santander"
            />
            {form.formState.errors.departamento?.message && (
              <p className="text-sm text-destructive">{form.formState.errors.departamento.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Categoría vehículo</Label>
            <Select
              value={form.watch("categoriaVehiculo")}
              onValueChange={(val) => form.setValue("categoriaVehiculo", (val ?? "Categoría I") as PeajeFormData["categoriaVehiculo"])}
            >
              <SelectTrigger className={form.formState.errors.categoriaVehiculo ? "border-destructive" : ""}>
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
            {form.formState.errors.categoriaVehiculo?.message && (
              <p className="text-sm text-destructive">{form.formState.errors.categoriaVehiculo.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tarifa (COP)</Label>
            <Input
              type="number"
              {...form.register("tarifa", { valueAsNumber: true })}
              className={form.formState.errors.tarifa ? "border-destructive" : ""}
            />
            {form.formState.errors.tarifa?.message && (
              <p className="text-sm text-destructive">{form.formState.errors.tarifa.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Fuente</Label>
            <Input
              {...form.register("fuente")}
              placeholder="Ej: ANI"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observaciones</Label>
            <Input
              {...form.register("observaciones")}
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
