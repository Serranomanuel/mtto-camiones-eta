"use client";

import { useState } from "react";
import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useVehiculos } from "@/hooks/use-vehiculos";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import type { Vehiculo } from "@/types/etalum";

const initialForm: Omit<Vehiculo, "id"> = {
  placa: "",
  marca: "",
  modelo: "",
  año: new Date().getFullYear(),
  tipoVehiculo: "Camión turbo",
  capacidadCargaKg: 0,
  ciudadBase: "",
  estado: "Activo",
  kmActual: 0,
  rendimientoKmGal: 0,
  soatVencimiento: "",
  tecnomecanicaVencimiento: "",
  proximoMantenimientoKm: 0,
  observaciones: "",
};

export default function VehiculosPage() {
  const { data, loading, create, update, delete: remove } = useVehiculos();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Vehiculo, "id">>(initialForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (v: Vehiculo) => {
    setEditingId(v.id);
    setForm({
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      año: v.año,
      tipoVehiculo: v.tipoVehiculo,
      capacidadCargaKg: v.capacidadCargaKg,
      ciudadBase: v.ciudadBase,
      estado: v.estado,
      kmActual: v.kmActual,
      rendimientoKmGal: v.rendimientoKmGal,
      soatVencimiento: v.soatVencimiento,
      tecnomecanicaVencimiento: v.tecnomecanicaVencimiento,
      proximoMantenimientoKm: v.proximoMantenimientoKm,
      observaciones: v.observaciones,
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

  const getSoatAlert = (v: Vehiculo) => {
    const days = differenceInDays(parseISO(v.soatVencimiento), new Date());
    if (days < 0) return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">SOAT vencido</Badge>;
    if (days < 30) return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">SOAT {days}d</Badge>;
    return null;
  };

  const getTecnoAlert = (v: Vehiculo) => {
    const days = differenceInDays(parseISO(v.tecnomecanicaVencimiento), new Date());
    if (days < 0) return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">Tecno vencida</Badge>;
    if (days < 30) return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">Tecno {days}d</Badge>;
    return null;
  };

  const getKmProgress = (v: Vehiculo) => {
    if (v.proximoMantenimientoKm <= 0) return 0;
    return Math.min((v.kmActual / v.proximoMantenimientoKm) * 100, 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vehículos</h1>
        </div>
        <SkeletonLoader variant="card" count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vehículos</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-1" />
          Nuevo vehículo
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((v) => (
          <Card key={v.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-mono">{v.placa}</CardTitle>
                  <p className="text-sm text-muted-foreground">{v.marca} {v.modelo}</p>
                </div>
                <StatusBadge status={v.estado} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {getSoatAlert(v)}
                  {getTecnoAlert(v)}
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">KM actual</span>
                    <span className="font-medium">{v.kmActual.toLocaleString()} / {v.proximoMantenimientoKm.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getKmProgress(v) >= 90 ? "bg-red-500" : getKmProgress(v) >= 70 ? "bg-orange-500" : "bg-emerald-500"}`}
                      style={{ width: `${getKmProgress(v)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Link href={`/vehiculos/${v.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">Ver ficha</Button>
              </Link>
              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(v)}>
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => openDelete(v.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar vehículo" : "Nuevo vehículo"}
        onSubmit={handleSave}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Placa</Label>
            <Input value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} />
          </div>
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Año</Label>
            <Input type="number" value={form.año} onChange={(e) => setForm({ ...form, año: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo vehículo</Label>
            <Select value={form.tipoVehiculo} onValueChange={(val) => setForm({ ...form, tipoVehiculo: val as Vehiculo["tipoVehiculo"] })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Camión turbo">Camión turbo</SelectItem>
                <SelectItem value="Camioneta">Camioneta</SelectItem>
                <SelectItem value="Furgón">Furgón</SelectItem>
                <SelectItem value="Tractomula">Tractomula</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Capacidad carga (kg)</Label>
            <Input type="number" value={form.capacidadCargaKg} onChange={(e) => setForm({ ...form, capacidadCargaKg: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Ciudad base</Label>
            <Input value={form.ciudadBase} onChange={(e) => setForm({ ...form, ciudadBase: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={form.estado} onValueChange={(val) => setForm({ ...form, estado: val as Vehiculo["estado"] })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="En taller">En taller</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>KM actual</Label>
            <Input type="number" value={form.kmActual} onChange={(e) => setForm({ ...form, kmActual: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Rendimiento (km/gal)</Label>
            <Input type="number" step="0.1" value={form.rendimientoKmGal} onChange={(e) => setForm({ ...form, rendimientoKmGal: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label>Vencimiento SOAT</Label>
            <Input type="date" value={form.soatVencimiento} onChange={(e) => setForm({ ...form, soatVencimiento: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Vencimiento Tecnomecánica</Label>
            <Input type="date" value={form.tecnomecanicaVencimiento} onChange={(e) => setForm({ ...form, tecnomecanicaVencimiento: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Próximo mantenimiento (km)</Label>
            <Input type="number" value={form.proximoMantenimientoKm} onChange={(e) => setForm({ ...form, proximoMantenimientoKm: Number(e.target.value) })} />
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
        title="Eliminar vehículo"
        description="¿Estás seguro de que deseas eliminar este vehículo? Esta acción no se puede deshacer."
      />
    </div>
  );
}
