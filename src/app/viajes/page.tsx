"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, Search } from "lucide-react";
import { useViajes } from "@/hooks/use-viajes";
import { useVehiculos } from "@/hooks/use-vehiculos";
import { useConductores } from "@/hooks/use-conductores";
import { useRutas } from "@/hooks/use-rutas";
import { useDespachos } from "@/hooks/use-despachos";
import { useCombustible } from "@/hooks/use-combustible";
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
import type { Viaje } from "@/types/etalum";

const CIUDADES = ["Bogotá", "Barranquilla", "Cartagena", "Santa Marta", "Bucaramanga"];

const initialForm = {
  fecha: "",
  rutaId: "",
  vehiculoId: "",
  conductorId: "",
  selectedDespachos: [] as string[],
  horaSalida: "",
  horaLlegada: "",
  kmInicial: 0,
  kmFinal: 0,
  kmRecorridos: 0,
  cantidadPeajes: 0,
  costoPeajes: 0,
  consumoGalones: 0,
  precioGalon: 0,
  costoCombustible: 0,
  costoTotal: 0,
  observaciones: "",
};

export default function ViajesPage() {
  const { data, loading, create, update, delete: remove } = useViajes();
  const { data: vehiculos } = useVehiculos();
  const { data: conductores } = useConductores();
  const { data: rutas } = useRutas();
  const { data: despachos, asignarViaje } = useDespachos();
  const { getPrecioActual } = useCombustible();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("basico");
  const [filterCiudadDespacho, setFilterCiudadDespacho] = useState<string>("all");

  const [search, setSearch] = useState("");
  const [filterFecha, setFilterFecha] = useState("");
  const [filterCiudad, setFilterCiudad] = useState<string>("all");
  const [filterVehiculo, setFilterVehiculo] = useState<string>("all");
  const [filterConductor, setFilterConductor] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");

  const selectedVehiculo = useMemo(() => {
    return vehiculos.find((v) => v.id === form.vehiculoId) || null;
  }, [vehiculos, form.vehiculoId]);

  const despachosDisponibles = useMemo(() => {
    return despachos.filter((d) => {
      if (d.viajeAsignadoId && d.viajeAsignadoId !== editingId) return false;
      if (d.estado !== "Programado") return false;
      if (filterCiudadDespacho !== "all" && d.ciudad !== filterCiudadDespacho) return false;
      return true;
    });
  }, [despachos, editingId, filterCiudadDespacho]);

  const selectedRuta = useMemo(() => {
    return rutas.find((r) => r.id === form.rutaId) || null;
  }, [rutas, form.rutaId]);

  const precioCombustible = useMemo(() => {
    if (!selectedVehiculo) return null;
    const destino = selectedRuta?.destino || "Bogotá";
    return getPrecioActual(destino, "Diésel");
  }, [selectedVehiculo, selectedRuta, getPrecioActual]);

  const kmRecorridos = useMemo(() => {
    return Math.max(0, form.kmFinal - form.kmInicial);
  }, [form.kmInicial, form.kmFinal]);

  const consumoGalones = useMemo(() => {
    if (!selectedVehiculo || kmRecorridos === 0) return 0;
    return +(kmRecorridos / selectedVehiculo.rendimientoKmGal).toFixed(2);
  }, [selectedVehiculo, kmRecorridos]);

  const precioGalon = useMemo(() => {
    return precioCombustible?.precioGalon || 0;
  }, [precioCombustible]);

  const costoCombustible = useMemo(() => {
    return +(consumoGalones * precioGalon).toFixed(0);
  }, [consumoGalones, precioGalon]);

  const costoPeajes = useMemo(() => {
    return +(form.cantidadPeajes * (selectedRuta?.peajeReferencia || 0)).toFixed(0);
  }, [form.cantidadPeajes, selectedRuta]);

  const costoTotal = useMemo(() => {
    return costoCombustible + costoPeajes;
  }, [costoCombustible, costoPeajes]);

  const filtered = useMemo(() => {
    return data.filter((v) => {
      if (search && !v.id.toLowerCase().includes(search.toLowerCase()) && !v.placa.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterFecha && v.fecha !== filterFecha) return false;
      if (filterCiudad !== "all" && v.ciudadDestino !== filterCiudad) return false;
      if (filterVehiculo !== "all" && v.vehiculoId !== filterVehiculo) return false;
      if (filterConductor !== "all" && v.conductorId !== filterConductor) return false;
      if (filterEstado !== "all" && v.estado !== filterEstado) return false;
      return true;
    });
  }, [data, search, filterFecha, filterCiudad, filterVehiculo, filterConductor, filterEstado]);

  const stats = useMemo(() => {
    const total = data.length;
    const programados = data.filter((v) => v.estado === "Programado").length;
    const enRuta = data.filter((v) => v.estado === "En ruta").length;
    const completados = data.filter((v) => v.estado === "Completado").length;
    return { total, programados, enRuta, completados };
  }, [data]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setActiveTab("basico");
    setModalOpen(true);
  };

  const openEdit = (v: Viaje) => {
    setEditingId(v.id);
    setForm({
      fecha: v.fecha,
      rutaId: v.rutaId,
      vehiculoId: v.vehiculoId,
      conductorId: v.conductorId,
      selectedDespachos: [],
      horaSalida: v.horaSalida,
      horaLlegada: v.horaLlegada,
      kmInicial: v.kmInicial,
      kmFinal: v.kmFinal,
      kmRecorridos: v.kmRecorridos,
      cantidadPeajes: v.cantidadPeajes,
      costoPeajes: v.costoPeajes,
      consumoGalones: v.consumoGalones,
      precioGalon: precioCombustible?.precioGalon || 0,
      costoCombustible: v.costoCombustible,
      costoTotal: v.costoTotal,
      observaciones: v.observaciones,
    });
    setActiveTab("basico");
    setModalOpen(true);
  };

  const handleSave = async () => {
    const conductor = conductores.find((c) => c.id === form.conductorId);
    const ruta = rutas.find((r) => r.id === form.rutaId);
    const payload = {
      fecha: form.fecha,
      rutaId: form.rutaId,
      ciudadDestino: ruta?.destino || "",
      vehiculoId: form.vehiculoId,
      placa: selectedVehiculo?.placa || "",
      conductorId: form.conductorId,
      conductorNombre: conductor?.nombreCompleto || "",
      despachosIncluidos: form.selectedDespachos.join(", "),
      numeroObrasIncluidas: form.selectedDespachos.length,
      horaSalida: form.horaSalida,
      horaLlegada: form.horaLlegada,
      kmInicial: form.kmInicial,
      kmFinal: form.kmFinal,
      kmRecorridos,
      cantidadPeajes: form.cantidadPeajes,
      costoPeajes,
      consumoGalones,
      costoCombustible,
      costoTotal,
      estado: editingId ? undefined as never : "Programado" as const,
      observaciones: form.observaciones,
      cliente: "",
      direccionOrigen: ruta?.origen || "",
      direccionDestino: ruta?.destino || "",
      tiempoRecorridoMin: 0,
    };
    if (editingId) {
      await update(editingId, payload);
    } else {
      await create(payload);
      for (const despachoId of form.selectedDespachos) {
        const viaje = data[data.length - 1];
        if (viaje) await asignarViaje(despachoId, viaje.id);
      }
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

  const toggleDespacho = (despachoId: string) => {
    setForm((prev) => {
      const selected = prev.selectedDespachos.includes(despachoId)
        ? prev.selectedDespachos.filter((id) => id !== despachoId)
        : [...prev.selectedDespachos, despachoId];
      return { ...prev, selectedDespachos: selected };
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Viajes</h1>
        </div>
        <SkeletonLoader variant="table-row" count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Viajes</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-1" />
          Nuevo Viaje
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total viajes</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Programados</p>
            <p className="text-2xl font-bold text-blue-600">{stats.programados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">En ruta</p>
            <p className="text-2xl font-bold text-orange-600">{stats.enRuta}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Completados</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.completados}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID o placa..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Input
          type="date"
          placeholder="Fecha"
          value={filterFecha}
          onChange={(e) => setFilterFecha(e.target.value)}
          className="w-full sm:w-[160px]"
        />
        <Select value={filterCiudad} onValueChange={(v) => v && setFilterCiudad(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Ciudad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CIUDADES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterVehiculo} onValueChange={(v) => v && setFilterVehiculo(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Vehículo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {vehiculos.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.placa}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterConductor} onValueChange={(v) => v && setFilterConductor(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Conductor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {conductores.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nombreCompleto}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterEstado} onValueChange={(v) => v && setFilterEstado(v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Programado">Programado</SelectItem>
            <SelectItem value="En ruta">En ruta</SelectItem>
            <SelectItem value="Completado">Completado</SelectItem>
            <SelectItem value="Cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead className="text-right">KMs</TableHead>
              <TableHead className="text-right">Costo Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No se encontraron viajes
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">{v.id}</TableCell>
                  <TableCell>{v.fecha}</TableCell>
                  <TableCell>{v.placa}</TableCell>
                  <TableCell className="text-xs">{v.conductorNombre}</TableCell>
                  <TableCell>{v.ciudadDestino}</TableCell>
                  <TableCell className="text-right">{v.kmRecorridos.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${v.costoTotal.toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={v.estado} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/viajes/${v.id}`}>
                        <Button variant="ghost" size="icon-sm">
                          <Eye className="size-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(v)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDelete(v.id)}>
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
        title={editingId ? "Editar viaje" : "Nuevo viaje"}
        onSubmit={handleSave}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-1 bg-muted p-1 rounded-lg">
            {(["basico", "despachos", "operacion", "costos"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "basico" ? "Básico" : tab === "despachos" ? "Despachos" : tab === "operacion" ? "Operación" : "Costos"}
              </button>
            ))}
          </div>

          {activeTab === "basico" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ruta</Label>
              <Select value={form.rutaId} onValueChange={(val) => val && setForm({ ...form, rutaId: val })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar ruta" />
                </SelectTrigger>
                <SelectContent>
                  {rutas.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.origen} → {r.destino} ({r.via})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vehículo (solo activos)</Label>
              <Select value={form.vehiculoId} onValueChange={(val) => val && setForm({ ...form, vehiculoId: val })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehiculos
                    .filter((v) => v.estado === "Activo")
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.placa} - {v.marca} {v.modelo}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conductor</Label>
              <Select value={form.conductorId} onValueChange={(val) => val && setForm({ ...form, conductorId: val })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar conductor" />
                </SelectTrigger>
                <SelectContent>
                  {conductores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombreCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          )}

          {activeTab === "despachos" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Filtrar por ciudad</Label>
              <Select value={filterCiudadDespacho} onValueChange={(v) => v && setFilterCiudadDespacho(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ciudad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CIUDADES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              {despachosDisponibles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay despachos programados disponibles
                </p>
              ) : (
                despachosDisponibles.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-start gap-3 p-3 border-b last:border-0 cursor-pointer hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={form.selectedDespachos.includes(d.id)}
                      onChange={() => toggleDespacho(d.id)}
                      className="accent-primary mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{d.id}</span>
                        <span className="text-xs text-muted-foreground">{d.ciudad}</span>
                      </div>
                      <p className="text-sm truncate">{d.descripcionCarga}</p>
                      <p className="text-xs text-muted-foreground">{d.nombreObra}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {form.selectedDespachos.length} despacho(s) seleccionado(s)
            </p>
          </div>
          )}

          {activeTab === "operacion" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Hora salida</Label>
                <Input
                  type="time"
                  value={form.horaSalida}
                  onChange={(e) => setForm({ ...form, horaSalida: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hora llegada</Label>
                <Input
                  type="time"
                  value={form.horaLlegada}
                  onChange={(e) => setForm({ ...form, horaLlegada: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>KM Inicial</Label>
                <Input
                  type="number"
                  value={form.kmInicial || ""}
                  onChange={(e) => setForm({ ...form, kmInicial: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>KM Final</Label>
                <Input
                  type="number"
                  value={form.kmFinal || ""}
                  onChange={(e) => setForm({ ...form, kmFinal: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>KM Recorridos</Label>
                <Input
                  type="number"
                  value={kmRecorridos}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Cantidad peajes</Label>
                <Input
                  type="number"
                  value={form.cantidadPeajes || ""}
                  onChange={(e) => setForm({ ...form, cantidadPeajes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Costo peajes (auto)</Label>
                <Input
                  type="number"
                  value={costoPeajes}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
          )}

          {activeTab === "costos" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Consumo galones (auto)</Label>
                <Input
                  type="number"
                  value={consumoGalones}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Precio galón (auto)</Label>
                <Input
                  type="number"
                  value={precioGalon}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Costo combustible (auto)</Label>
                <Input
                  type="number"
                  value={costoCombustible}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Costo total (auto)</Label>
                <Input
                  type="number"
                  value={costoTotal}
                  readOnly
                  className="bg-muted font-bold"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observaciones</Label>
              <Input
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              />
            </div>
          </div>
          )}
        </div>
      </FormModal>

      <ConfirmDialog
        open={confirmOpen}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setDeletingId(null); }}
        title="Eliminar viaje"
        description="¿Estás seguro de que deseas eliminar este viaje? Esta acción no se puede deshacer."
      />
    </div>
  );
}
