"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { differenceInDays, parseISO, format } from "date-fns";
import { ArrowLeft, Pencil } from "lucide-react";
import { useVehiculos } from "@/hooks/use-vehiculos";
import { useViajes } from "@/hooks/use-viajes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormModal } from "@/components/shared/FormModal";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Vehiculo } from "@/types/etalum";

export default function VehiculoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<Vehiculo, "id"> | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const { data, loading, update } = useVehiculos();
  const { data: viajes } = useViajes();

  const vehiculo = data.find((v) => v.id === id);
  const viajesVehiculo = viajes.filter((v) => v.vehiculoId === id);

  const openEdit = () => {
    if (!vehiculo) return;
    setForm({
      placa: vehiculo.placa,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      año: vehiculo.año,
      tipoVehiculo: vehiculo.tipoVehiculo,
      capacidadCargaKg: vehiculo.capacidadCargaKg,
      ciudadBase: vehiculo.ciudadBase,
      estado: vehiculo.estado,
      kmActual: vehiculo.kmActual,
      rendimientoKmGal: vehiculo.rendimientoKmGal,
      soatVencimiento: vehiculo.soatVencimiento,
      tecnomecanicaVencimiento: vehiculo.tecnomecanicaVencimiento,
      proximoMantenimientoKm: vehiculo.proximoMantenimientoKm,
      observaciones: vehiculo.observaciones,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (form && id) {
      await update(id, form);
    }
    setModalOpen(false);
  };

  if (loading) {
    return <SkeletonLoader variant="detail" count={8} />;
  }

  if (!vehiculo) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Vehículo no encontrado</p>
        <Link href="/vehiculos">
          <Button variant="outline"><ArrowLeft className="size-4 mr-1" /> Volver</Button>
        </Link>
      </div>
    );
  }

  const soatDays = differenceInDays(parseISO(vehiculo.soatVencimiento), new Date());
  const tecnoDays = differenceInDays(parseISO(vehiculo.tecnomecanicaVencimiento), new Date());
  const kmRestantes = Math.max(vehiculo.proximoMantenimientoKm - vehiculo.kmActual, 0);
  const kmProgress = vehiculo.proximoMantenimientoKm > 0
    ? Math.min((vehiculo.kmActual / vehiculo.proximoMantenimientoKm) * 100, 100)
    : 0;

  const getBarColor = (days: number) => {
    if (days < 0) return "bg-red-500";
    if (days < 30) return "bg-orange-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vehiculos">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-mono">{vehiculo.placa}</h1>
            <p className="text-muted-foreground">{vehiculo.marca} {vehiculo.modelo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={vehiculo.estado} />
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="size-3.5 mr-1" /> Editar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del vehículo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DataField label="Placa" value={vehiculo.placa} />
            <DataField label="Marca" value={vehiculo.marca} />
            <DataField label="Modelo" value={vehiculo.modelo} />
            <DataField label="Año" value={String(vehiculo.año)} />
            <DataField label="Tipo" value={vehiculo.tipoVehiculo} />
            <DataField label="Capacidad carga" value={`${vehiculo.capacidadCargaKg.toLocaleString()} kg`} />
            <DataField label="Ciudad base" value={vehiculo.ciudadBase} />
            <DataField label="KM actual" value={`${vehiculo.kmActual.toLocaleString()} km`} />
            <DataField label="Rendimiento" value={`${vehiculo.rendimientoKmGal} km/gal`} />
            {vehiculo.observaciones && (
              <div className="sm:col-span-2 lg:col-span-3">
                <DataField label="Observaciones" value={vehiculo.observaciones} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos y mantenimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">SOAT</span>
                {soatDays < 0 ? (
                  <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">Vencido</Badge>
                ) : soatDays < 30 ? (
                  <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400">{soatDays} días</Badge>
                ) : (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">{soatDays} días</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Vence: {format(parseISO(vehiculo.soatVencimiento), "dd/MM/yyyy")}</p>
              <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getBarColor(soatDays)}`} style={{ width: `${Math.min(Math.max((soatDays / 365) * 100, 0), 100)}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tecnomecánica</span>
                {tecnoDays < 0 ? (
                  <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">Vencida</Badge>
                ) : tecnoDays < 30 ? (
                  <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400">{tecnoDays} días</Badge>
                ) : (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">{tecnoDays} días</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Vence: {format(parseISO(vehiculo.tecnomecanicaVencimiento), "dd/MM/yyyy")}</p>
              <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getBarColor(tecnoDays)}`} style={{ width: `${Math.min(Math.max((tecnoDays / 365) * 100, 0), 100)}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Próximo mantenimiento</span>
                <Badge className={kmRestantes <= 0 ? "bg-red-500/10 text-red-700 dark:text-red-400" : kmRestantes < 2000 ? "bg-orange-500/10 text-orange-700 dark:text-orange-400" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}>
                  {kmRestantes.toLocaleString()} km
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Meta: {vehiculo.proximoMantenimientoKm.toLocaleString()} km</p>
              <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${kmProgress >= 90 ? "bg-red-500" : kmProgress >= 70 ? "bg-orange-500" : "bg-emerald-500"}`} style={{ width: `${kmProgress}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Viajes asociados ({viajesVehiculo.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {viajesVehiculo.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay viajes registrados para este vehículo</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Conductor</TableHead>
                  <TableHead className="text-right">Km</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viajesVehiculo.map((viaje) => (
                  <TableRow key={viaje.id}>
                    <TableCell>{viaje.fecha}</TableCell>
                    <TableCell>{viaje.ciudadDestino}</TableCell>
                    <TableCell>{viaje.conductorNombre}</TableCell>
                    <TableCell className="text-right">{viaje.kmRecorridos.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${viaje.costoTotal.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={viaje.estado} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {form && (
        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Editar vehículo"
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
      )}
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
