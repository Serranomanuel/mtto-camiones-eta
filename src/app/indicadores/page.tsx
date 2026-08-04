"use client";

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useIndicadores } from "@/hooks/use-indicadores";
import { useViajes } from "@/hooks/use-viajes";
import { useDespachos } from "@/hooks/use-despachos";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import type { Indicador } from "@/types/etalum";

const formatCOP = (value: number) =>
  `$${value.toLocaleString("es-CO")}`;

const trendConfig = {
  up: { icon: TrendingUp, label: "Subió", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  down: { icon: TrendingDown, label: "Bajó", color: "text-red-500", bg: "bg-red-500/10" },
  stable: { icon: Minus, label: "Estable", color: "text-muted-foreground", bg: "bg-muted" },
};

function formatValor(valor: number, unidad: string): string {
  if (unidad === "COP" || unidad === "COP/Km") return formatCOP(valor);
  if (unidad === "%") return `${valor}%`;
  return valor.toLocaleString("es-CO");
}

export default function IndicadoresPage() {
  const { data: indicadoresRaw, loading } = useIndicadores();
  const { data: viajes } = useViajes();
  const { data: despachos } = useDespachos();
  const [periodo, setPeriodo] = useState<"Semanal" | "Mensual" | "Anual">("Semanal");

  const indicadoresFiltrados = useMemo(() => {
    return indicadoresRaw.filter((ind) => {
      if (periodo === "Semanal") return ind.periodo === "Semanal";
      if (periodo === "Mensual") return ind.periodo === "Semanal" || ind.periodo === "Mensual" || ind.periodo === "Permanente";
      return true;
    });
  }, [indicadoresRaw, periodo]);

  const indicadoresCalculados = useMemo(() => {
    if (indicadoresFiltrados.length === 0) return [];

    const totalViajes = viajes.length;
    const totalDespachos = despachos.length;
    const despachosEntregados = despachos.filter((d) => d.estado === "Entregado").length;
    const totalCostoViajes = viajes.reduce((sum, v) => sum + v.costoTotal, 0);
    const totalKm = viajes.reduce((sum, v) => sum + v.kmRecorridos, 0);
    const costoPromedioViaje = totalViajes > 0 ? Math.round(totalCostoViajes / totalViajes) : 0;
    const costoPorKm = totalKm > 0 ? Math.round(totalCostoViajes / totalKm) : 0;
    const porcentajeEntregas = totalDespachos > 0 ? Math.round((despachosEntregados / totalDespachos) * 100) : 0;

    const overrides: Record<string, Partial<Indicador>> = {
      "KPI-01": { valorActual: totalDespachos },
      "KPI-02": { valorActual: porcentajeEntregas },
      "KPI-03": { valorActual: totalCostoViajes },
      "KPI-04": { valorActual: costoPromedioViaje },
      "KPI-05": { valorActual: totalKm },
      "KPI-06": { valorActual: costoPorKm },
    };

    return indicadoresFiltrados.map((ind) => ({
      ...ind,
      ...overrides[ind.id],
    }));
  }, [indicadoresFiltrados, viajes, despachos]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Indicadores</h1>
        </div>
        <SkeletonLoader variant="card" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Indicadores</h1>
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as "Semanal" | "Mensual" | "Anual")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semanal">Semanal</SelectItem>
            <SelectItem value="Mensual">Mensual</SelectItem>
            <SelectItem value="Anual">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {indicadoresCalculados.map((ind) => {
          const trend = trendConfig[ind.tendencia];
          const TrendIcon = trend.icon;
          return (
            <Card key={ind.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{ind.nombre}</p>
                      <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trend.bg} ${trend.color}`}>
                        <TrendIcon className="h-3 w-3" />
                        <span className="hidden sm:inline">{trend.label}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {ind.descripcion}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tracking-tight">
                        {formatValor(ind.valorActual, ind.unidad)}
                      </span>
                      {ind.unidad === "%" && (
                        <span className="text-sm text-muted-foreground">/ {ind.meta}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {ind.meta !== "—" && (
                        <span>
                          Meta: <span className="font-medium text-foreground">{ind.meta}</span>
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {ind.periodo}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {indicadoresCalculados.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              No hay indicadores disponibles para este período.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
