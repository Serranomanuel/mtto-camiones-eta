"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { useDespachos } from "@/hooks/use-despachos";
import { useViajes } from "@/hooks/use-viajes";
import { useVehiculos } from "@/hooks/use-vehiculos";
import { useObras } from "@/hooks/use-obras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type ResultadoDespacho = "Cumplido" | "Pendiente" | "No cumplido";

interface DespachoComparativo {
  id: string;
  obra: string;
  fechaProgramada: string;
  fechaReal: string | null;
  resultado: ResultadoDespacho;
  diferenciaDias: number | null;
}

const SEMANAS = Array.from({ length: 52 }, (_, i) => `Sem ${i + 1}`);

function getWeekNumber(dateStr: string): number {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

function getResultado(
  estado: string,
  viajeCompletado: boolean
): ResultadoDespacho {
  if (estado === "Entregado") return "Cumplido";
  if (estado === "Despachado" && viajeCompletado) return "Cumplido";
  if (estado === "Programado" || estado === "En preparación") return "Pendiente";
  if (estado === "Cancelado") return "No cumplido";
  return "No cumplido";
}

function diffDays(fechaProgramada: string, fechaReal: string): number {
  const p = new Date(fechaProgramada);
  const r = new Date(fechaReal);
  return Math.round((r.getTime() - p.getTime()) / (1000 * 60 * 60 * 24));
}

const COLORS: Record<ResultadoDespacho, string> = {
  Cumplido: "#22c55e",
  Pendiente: "#f97316",
  "No cumplido": "#ef4444",
};

export default function ComparativoPage() {
  const { data: despachos, loading: loadingDespachos } = useDespachos();
  const { data: viajes } = useViajes();
  const { data: vehiculos } = useVehiculos();
  const { data: obras } = useObras();

  const [semana, setSemana] = useState<string>("all");
  const [obra, setObra] = useState<string>("all");
  const [vehiculo, setVehiculo] = useState<string>("all");

  const viajesMap = useMemo(() => {
    const map = new Map<string, typeof viajes[number]>();
    viajes.forEach((v) => map.set(v.id, v));
    return map;
  }, [viajes]);

  const comparativos = useMemo<DespachoComparativo[]>(() => {
    return despachos.map((d) => {
      const viaje = d.viajeAsignadoId
        ? viajesMap.get(d.viajeAsignadoId)
        : undefined;
      const viajeCompletado = viaje?.estado === "Completado";
      const resultado = getResultado(d.estado, viajeCompletado);
      const fechaReal =
        d.estado === "Despachado" || d.estado === "Entregado"
          ? viaje?.fecha ?? null
          : null;
      const diferencia =
        fechaReal ? diffDays(d.fecha, fechaReal) : null;

      return {
        id: d.id,
        obra: d.nombreObra,
        fechaProgramada: d.fecha,
        fechaReal,
        resultado,
        diferenciaDias: diferencia,
      };
    });
  }, [despachos, viajesMap]);

  const filtered = useMemo(() => {
    return comparativos.filter((c) => {
      if (obra !== "all") {
        const obraObj = obras.find((o) => o.id === obra);
        if (obraObj && c.obra !== obraObj.nombre) return false;
      }
      if (vehiculo !== "all") {
        const despacho = despachos.find((d) => d.id === c.id);
        if (despacho?.viajeAsignadoId) {
          const viaje = viajesMap.get(despacho.viajeAsignadoId);
          if (viaje && viaje.vehiculoId !== vehiculo) return false;
        } else {
          return false;
        }
      }
      if (semana !== "all") {
        const semanaNum = getWeekNumber(c.fechaProgramada);
        if (String(semanaNum) !== semana) return false;
      }
      return true;
    });
  }, [comparativos, obra, vehiculo, semana, despachos, viajesMap, obras]);

  const total = filtered.length;
  const cumplidos = filtered.filter((d) => d.resultado === "Cumplido").length;
  const pendientes = filtered.filter((d) => d.resultado === "Pendiente").length;
  const noCumplidos = filtered.filter((d) => d.resultado === "No cumplido").length;
  const porcentajeCumplimiento = total > 0 ? Math.round((cumplidos / total) * 100) : 0;

  const chartData = [
    { name: "Despachos", Cumplidos: cumplidos, Pendientes: pendientes, "No cumplidos": noCumplidos },
  ];

  if (loadingDespachos) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando comparativo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comparativo Programado vs Real</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={semana} onValueChange={(v) => v && setSemana(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semana" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las semanas</SelectItem>
            {SEMANAS.map((s) => (
              <SelectItem key={s} value={String(getWeekNumber(`${new Date().getFullYear()}-01-01`))}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={obra} onValueChange={(v) => v && setObra(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Obra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las obras</SelectItem>
            {obras.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={vehiculo} onValueChange={(v) => v && setVehiculo(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Vehículo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los vehículos</SelectItem>
            {vehiculos.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.placa}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="col-span-1 flex flex-col items-center justify-center py-6">
          <CardContent className="flex flex-col items-center gap-2">
            <div className="relative size-32">
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/30"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  strokeWidth="8"
                  strokeDasharray={`${porcentajeCumplimiento * 2.64} ${264 - porcentajeCumplimiento * 2.64}`}
                  strokeLinecap="round"
                  className={
                    porcentajeCumplimiento >= 80
                      ? "stroke-emerald-500"
                      : porcentajeCumplimiento >= 50
                      ? "stroke-orange-500"
                      : "stroke-red-500"
                  }
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{porcentajeCumplimiento}%</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">% Cumplimiento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Programados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Cumplidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{cumplidos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{pendientes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">No Cumplidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{noCumplidos}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Cumplidos" stackId="a" fill={COLORS.Cumplido} />
              <Bar dataKey="Pendientes" stackId="a" fill={COLORS.Pendiente} />
              <Bar dataKey="No cumplidos" stackId="a" fill={COLORS["No cumplido"]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Despachos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Despacho</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Fecha Programada</TableHead>
                <TableHead>Fecha Real</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Diferencia (días)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay despachos para los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono">{d.id}</TableCell>
                    <TableCell>{d.obra}</TableCell>
                    <TableCell>{d.fechaProgramada}</TableCell>
                    <TableCell>{d.fechaReal ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={d.resultado} />
                    </TableCell>
                    <TableCell>
                      {d.diferenciaDias !== null ? (
                        <span
                          className={
                            d.diferenciaDias === 0
                              ? "text-emerald-600"
                              : d.diferenciaDias < 0
                              ? "text-orange-600"
                              : "text-red-600"
                          }
                        >
                          {d.diferenciaDias > 0 ? "+" : ""}
                          {d.diferenciaDias}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
