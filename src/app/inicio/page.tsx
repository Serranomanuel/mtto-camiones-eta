"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { vehiculos, conductores, viajes, despachos, obras } from "@/lib/mock-data";
import {
  Truck,
  CalendarDays,
  MapPin,
  FileText,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
  differenceInDays,
} from "date-fns";

export default function InicioPage() {
  const today = useMemo(() => new Date(), []);

  const weekStart = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today]);
  const weekEnd = useMemo(() => endOfWeek(today, { weekStartsOn: 1 }), [today]);

  const stats = useMemo(() => {
    const despachosSemana = despachos.filter((d) => {
      const fecha = parseISO(d.fecha);
      return isWithinInterval(fecha, { start: weekStart, end: weekEnd });
    }).length;

    const viajesCompletados = viajes.filter(
      (v) => v.estado === "Completado"
    );

    const costoTotal = viajesCompletados.reduce(
      (sum, v) => sum + v.costoTotal,
      0
    );

    const kmTotales = viajesCompletados.reduce(
      (sum, v) => sum + v.kmRecorridos,
      0
    );

    const obrasPendientes = obras.filter(
      (o) => o.estadoDireccion === "Falta dirección"
    ).length;

    const soatProxVencer = vehiculos.filter((v) => {
      const diff = differenceInDays(parseISO(v.soatVencimiento), today);
      return diff >= 0 && diff <= 30;
    });

    const licenciasProximas = conductores.filter((c) => {
      const diff = differenceInDays(parseISO(c.licenciaVencimiento), today);
      return diff >= 0 && diff <= 30;
    });

    const ultimosViajes = [...viajes]
      .sort((a, b) => parseISO(b.fecha).getTime() - parseISO(a.fecha).getTime())
      .slice(0, 5);

    return {
      despachosSemana,
      costoTotal,
      kmTotales,
      obrasPendientes,
      soatProxVencer,
      licenciasProximas,
      ultimosViajes,
    };
  }, [weekStart, weekEnd, today]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inicio</h1>
        <p className="text-muted-foreground">
          Resumen general de operaciones
        </p>
      </div>

      {(stats.soatProxVencer.length > 0 || stats.licenciasProximas.length > 0) && (
        <div className="space-y-2">
          {stats.soatProxVencer.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 text-sm"
            >
              <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
              <span>
                <strong>{v.placa}</strong> — SOAT vence el{" "}
                {parseISO(v.soatVencimiento).toLocaleDateString("es-CO")}
              </span>
            </div>
          ))}
          {stats.licenciasProximas.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 text-sm"
            >
              <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
              <span>
                <strong>{c.nombreCompleto}</strong> — Licencia vence el{" "}
                {parseISO(c.licenciaVencimiento).toLocaleDateString("es-CO")}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Despachos de la semana"
          value={stats.despachosSemana}
          icon={Truck}
          trend="stable"
        />
        <KpiCard
          title="Costo total de viajes"
          value={new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
          }).format(stats.costoTotal)}
          icon={TrendingUp}
          trend="up"
        />
        <KpiCard
          title="Km recorridos"
          value={stats.kmTotales.toLocaleString("es-CO")}
          unit="km"
          icon={MapPin}
          trend="up"
        />
        <KpiCard
          title="Obras con dirección pendiente"
          value={stats.obrasPendientes}
          icon={MapPin}
          trend="stable"
        />
        <KpiCard
          title="SOAT próximo a vencer"
          value={stats.soatProxVencer.length}
          unit="vehículos"
          icon={AlertTriangle}
          trend={stats.soatProxVencer.length > 0 ? "down" : "stable"}
        />
        <KpiCard
          title="Licencias próximas a vencer"
          value={stats.licenciasProximas.length}
          unit="conductores"
          icon={AlertTriangle}
          trend={stats.licenciasProximas.length > 0 ? "down" : "stable"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/viajes/nuevo" className="contents">
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <Truck className="h-5 w-5" />
            <span className="text-xs">Nuevo Viaje</span>
          </Button>
        </Link>
        <Link href="/programacion/nuevo" className="contents">
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <CalendarDays className="h-5 w-5" />
            <span className="text-xs">Programar Despacho</span>
          </Button>
        </Link>
        <Link href="/mapa" className="contents">
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <MapPin className="h-5 w-5" />
            <span className="text-xs">Ver Mapa</span>
          </Button>
        </Link>
        <Link href="/reportes" className="contents">
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <FileText className="h-5 w-5" />
            <span className="text-xs">Generar Reporte</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Últimos viajes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Placa</th>
                  <th className="pb-2 font-medium">Conductor</th>
                  <th className="pb-2 font-medium">Ciudad</th>
                  <th className="pb-2 font-medium text-right">Costo</th>
                  <th className="pb-2 font-medium text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats.ultimosViajes.map((viaje) => (
                  <tr key={viaje.id} className="border-b last:border-0">
                    <td className="py-2.5 font-mono text-xs">{viaje.id}</td>
                    <td className="py-2.5">
                      {parseISO(viaje.fecha).toLocaleDateString("es-CO")}
                    </td>
                    <td className="py-2.5 font-mono text-xs">{viaje.placa}</td>
                    <td className="py-2.5">{viaje.conductorNombre}</td>
                    <td className="py-2.5">{viaje.ciudadDestino}</td>
                    <td className="py-2.5 text-right font-mono text-xs">
                      {viaje.costoTotal > 0
                        ? new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            maximumFractionDigits: 0,
                          }).format(viaje.costoTotal)
                        : "—"}
                    </td>
                    <td className="py-2.5 text-right">
                      <StatusBadge status={viaje.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
