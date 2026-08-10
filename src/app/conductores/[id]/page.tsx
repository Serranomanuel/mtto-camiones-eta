"use client";

export const dynamic = "force-dynamic";

import { use, useMemo } from "react";
import Link from "next/link";
import { useConductores } from "@/hooks/use-conductores";
import { useVehiculos } from "@/hooks/use-vehiculos";
import { useViajes } from "@/hooks/use-viajes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import {
  ArrowLeft,
  Calendar,
  Car,
  FileText,
  Route,
  Truck,
  User,
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

function formatoFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatoMoneda(valor: number): string {
  return valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });
}

export default function ConductorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: conductores, loading } = useConductores();
  const { data: vehiculos } = useVehiculos();
  const { data: viajes } = useViajes();

  const conductor = useMemo(
    () => conductores.find((c) => c.id === id),
    [conductores, id]
  );

  const vehiculo = useMemo(
    () =>
      conductor?.vehiculoAsignadoId
        ? vehiculos.find((v) => v.id === conductor.vehiculoAsignadoId) ?? null
        : null,
    [conductor, vehiculos]
  );

  const viajesConductor = useMemo(
    () => viajes.filter((v) => v.conductorId === id),
    [viajes, id]
  );

  const stats = useMemo(() => {
    const completados = viajesConductor.filter((v) => v.estado === "Completado");
    return {
      totalViajes: completados.length,
      kmRecorridos: completados.reduce((acc, v) => acc + v.kmRecorridos, 0),
      costoTotal: completados.reduce((acc, v) => acc + v.costoTotal, 0),
    };
  }, [viajesConductor]);

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <SkeletonLoader count={4} />
      </div>
    );
  }

  if (!conductor) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Conductor no encontrado</p>
        <Link href="/conductores">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>
    );
  }

  const dias = diasParaVencer(conductor.licenciaVencimiento);
  const alertaVencimiento = dias >= 0 && dias < 30;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/conductores">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar>
          <AvatarFallback>{getInitials(conductor.nombreCompleto)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {conductor.nombreCompleto}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{conductor.id}</span>
            <StatusBadge status={conductor.estado} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Datos personales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cédula</span>
              <span className="font-medium">{conductor.cedula}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teléfono</span>
              <span className="font-medium">{conductor.telefono}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ciudad base</span>
              <span className="font-medium">{conductor.ciudadBase}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha ingreso</span>
              <span className="font-medium">
                {formatoFecha(conductor.fechaIngreso)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={
            alertaVencimiento
              ? "border-orange-400 dark:border-orange-600"
              : ""
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Licencia de conducir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoría</span>
              <Badge variant="outline">{conductor.categoriaLicencia}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha vencimiento</span>
              <span
                className={
                  alertaVencimiento
                    ? "font-semibold text-orange-600 dark:text-orange-400"
                    : "font-medium"
                }
              >
                {formatoFecha(conductor.licenciaVencimiento)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Días restantes</span>
              <span
                className={
                  dias < 0
                    ? "font-semibold text-red-600 dark:text-red-400"
                    : alertaVencimiento
                      ? "font-semibold text-orange-600 dark:text-orange-400"
                      : "font-medium"
                }
              >
                {dias < 0
                  ? `Vencida hace ${Math.abs(dias)} días`
                  : dias === 0
                    ? "Vence hoy"
                    : `${dias} días`}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4" />
              Vehículo asignado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {vehiculo ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Placa</span>
                  <Link
                    href={`/vehiculos/${vehiculo.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {vehiculo.placa}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marca / Modelo</span>
                  <span className="font-medium">
                    {vehiculo.marca} {vehiculo.modelo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium">{vehiculo.tipoVehiculo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <StatusBadge status={vehiculo.estado} />
                </div>
              </div>
            ) : (
              <div className="flex h-20 items-center justify-center text-muted-foreground">
                Sin vehículo asignado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Route className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total viajes</p>
              <p className="text-xl font-bold">{stats.totalViajes}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Km recorridos</p>
              <p className="text-xl font-bold">{stats.kmRecorridos.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Costo total</p>
              <p className="text-xl font-bold">{formatoMoneda(stats.costoTotal)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Viajes asociados</CardTitle>
        </CardHeader>
        <CardContent>
          {viajesConductor.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-muted-foreground">
              No hay viajes registrados para este conductor
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Km</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viajesConductor.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <Link
                          href={`/viajes/${v.id}`}
                          className="font-medium hover:underline"
                        >
                          {v.id}
                        </Link>
                      </TableCell>
                      <TableCell>{formatoFecha(v.fecha)}</TableCell>
                      <TableCell>{v.ciudadDestino}</TableCell>
                      <TableCell>{v.placa}</TableCell>
                      <TableCell>{v.kmRecorridos.toLocaleString()} km</TableCell>
                      <TableCell>{formatoMoneda(v.costoTotal)}</TableCell>
                      <TableCell>
                        <StatusBadge status={v.estado} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
