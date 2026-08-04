"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Pencil, Trash2, Fuel } from "lucide-react";
import { useCombustible } from "@/hooks/use-combustible";
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
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import type { Combustible } from "@/types/etalum";

const formatCOP = (value: number) =>
  `$${value.toLocaleString("es-CO")}`;

const initialForm: Omit<Combustible, "id"> = {
  fecha: new Date().toISOString().split("T")[0],
  ciudad: "",
  tipo: "Diésel",
  precioGalon: 0,
  fuente: "",
  observaciones: "",
};

const ciudades = ["Bogotá", "Barranquilla", "Cartagena", "Santa Marta", "Bucaramanga"];

export default function CombustiblePage() {
  const { data, loading, create, update, delete: remove } = useCombustible();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Combustible, "id">>(initialForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filterCiudad, setFilterCiudad] = useState("all");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (filterCiudad !== "all" && item.ciudad !== filterCiudad) return false;
      if (filterTipo !== "all" && item.tipo !== filterTipo) return false;
      if (filterDateRange.from) {
        const fecha = parseISO(item.fecha);
        if (fecha < filterDateRange.from) return false;
      }
      if (filterDateRange.to) {
        const fecha = parseISO(item.fecha);
        if (fecha > filterDateRange.to) return false;
      }
      return true;
    });
  }, [data, filterCiudad, filterTipo, filterDateRange]);

  const kpis = useMemo(() => {
    if (data.length === 0) {
      return { promedio: 0, ciudadMasCara: "—", ciudadMasBarata: "—", ultimaActualizacion: "—" };
    }
    const promedio = data.reduce((sum, c) => sum + c.precioGalon, 0) / data.length;

    const byCiudad = new Map<string, number[]>();
    data.forEach((c) => {
      const arr = byCiudad.get(c.ciudad) || [];
      arr.push(c.precioGalon);
      byCiudad.set(c.ciudad, arr);
    });

    let maxCiudad = "";
    let maxPrecio = 0;
    let minCiudad = "";
    let minPrecio = Infinity;
    byCiudad.forEach((precios, ciudad) => {
      const avg = precios.reduce((a, b) => a + b, 0) / precios.length;
      if (avg > maxPrecio) { maxPrecio = avg; maxCiudad = ciudad; }
      if (avg < minPrecio) { minPrecio = avg; minCiudad = ciudad; }
    });

    const sorted = [...data].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    return {
      promedio: Math.round(promedio),
      ciudadMasCara: maxCiudad || "—",
      ciudadMasBarata: minCiudad || "—",
      ultimaActualizacion: sorted[0]
        ? format(parseISO(sorted[0].fecha), "dd MMM yyyy", { locale: es })
        : "—",
    };
  }, [data]);

  const chartData = useMemo(() => {
    const sorted = [...data]
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .map((c) => ({
        fecha: format(parseISO(c.fecha), "dd/MM"),
        precio: c.precioGalon,
        ciudad: c.ciudad,
      }));
    return sorted;
  }, [data]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (c: Combustible) => {
    setEditingId(c.id);
    setForm({
      fecha: c.fecha,
      ciudad: c.ciudad,
      tipo: c.tipo,
      precioGalon: c.precioGalon,
      fuente: c.fuente,
      observaciones: c.observaciones,
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
          <h1 className="text-2xl font-bold">Combustible</h1>
        </div>
        <SkeletonLoader variant="card" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Combustible</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-1" />
          Nuevo registro
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Precio promedio diésel"
          value={formatCOP(kpis.promedio)}
          icon={Fuel}
        />
        <KpiCard
          title="Ciudad más cara"
          value={kpis.ciudadMasCara}
          icon={Fuel}
        />
        <KpiCard
          title="Ciudad más barata"
          value={kpis.ciudadMasBarata}
          icon={Fuel}
        />
        <KpiCard
          title="Última actualización"
          value={kpis.ultimaActualizacion}
          icon={Fuel}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendencia de precios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => [formatCOP(Number(value)), "Precio"]}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="precio"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={filterCiudad} onValueChange={(v) => setFilterCiudad(v ?? "all")}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {ciudades.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v ?? "all")}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Diésel">Diésel</SelectItem>
                <SelectItem value="Gasolina corriente">
                  Gasolina corriente
                </SelectItem>
                <SelectItem value="Gasolina extra">Gasolina extra</SelectItem>
              </SelectContent>
            </Select>

            <DateRangePicker value={filterDateRange} onChange={setFilterDateRange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registros ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Precio / galón</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No se encontraron registros
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">
                        {format(parseISO(c.fecha), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.ciudad}</Badge>
                      </TableCell>
                      <TableCell>{c.tipo}</TableCell>
                      <TableCell className="font-medium">
                        {formatCOP(c.precioGalon)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.fuente}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openDelete(c.id)}
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
        title={editingId ? "Editar registro" : "Nuevo registro"}
        onSubmit={handleSave}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Ciudad</Label>
            <Select
              value={form.ciudad}
              onValueChange={(val) => setForm({ ...form, ciudad: val ?? "" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar ciudad" />
              </SelectTrigger>
              <SelectContent>
                {ciudades.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select
              value={form.tipo}
              onValueChange={(val) =>
                setForm({ ...form, tipo: (val ?? "Diésel") as Combustible["tipo"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Diésel">Diésel</SelectItem>
                <SelectItem value="Gasolina corriente">
                  Gasolina corriente
                </SelectItem>
                <SelectItem value="Gasolina extra">Gasolina extra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Precio galón (COP)</Label>
            <Input
              type="number"
              value={form.precioGalon}
              onChange={(e) =>
                setForm({ ...form, precioGalon: Number(e.target.value) })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fuente</Label>
            <Input
              value={form.fuente}
              onChange={(e) => setForm({ ...form, fuente: e.target.value })}
              placeholder="Ej: Ministerio de Minas"
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
        title="Eliminar registro"
        description="¿Estás seguro de que deseas eliminar este registro de combustible? Esta acción no se puede deshacer."
      />
    </div>
  );
}
