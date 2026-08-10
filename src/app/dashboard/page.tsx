"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useCallback } from "react";
import { useViajes } from "@/hooks/use-viajes";
import { useDespachos } from "@/hooks/use-despachos";
import { useVehiculos } from "@/hooks/use-vehiculos";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { KpiCard } from "@/components/shared/KpiCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Truck,
  DollarSign,
  Route,
  TrendingDown,
  RefreshCw,
} from "lucide-react";

const COLORS = {
  blue: "#1e40af",
  amber: "#f59e0b",
  emerald: "#10b981",
  red: "#ef4444",
  violet: "#8b5cf6",
};

const PIE_COLORS = [
  COLORS.blue,
  COLORS.emerald,
  COLORS.amber,
  COLORS.red,
  COLORS.violet,
];

const CIUDADES = ["Bogotá", "Barranquilla", "Cartagena", "Santa Marta", "Bucaramanga"];

export default function DashboardPage() {
  const { data: viajes, loading: loadingViajes } = useViajes();
  const { data: despachos, loading: loadingDespachos } = useDespachos();
  const { data: vehiculos, loading: loadingVehiculos } = useVehiculos();

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [ciudad, setCiudad] = useState<string>("all");
  const [vehiculoId, setVehiculoId] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const loading = loadingViajes || loadingDespachos || loadingVehiculos;

  const filteredViajes = useMemo(() => {
    return viajes.filter((v) => {
      if (ciudad !== "all" && v.ciudadDestino !== ciudad) return false;
      if (vehiculoId !== "all" && v.vehiculoId !== vehiculoId) return false;
      return true;
    });
  }, [viajes, ciudad, vehiculoId]);

  const filteredDespachos = useMemo(() => {
    return despachos.filter((d) => {
      if (ciudad !== "all" && d.ciudad !== ciudad) return false;
      return true;
    });
  }, [despachos, ciudad]);

  const kpis = useMemo(() => {
    const totalViajes = filteredViajes.length;
    const costoTotal = filteredViajes.reduce((acc, v) => acc + v.costoTotal, 0);
    const kmTotales = filteredViajes.reduce((acc, v) => acc + v.kmRecorridos, 0);
    const promedioCostoKm = kmTotales > 0 ? costoTotal / kmTotales : 0;

    return {
      totalViajes,
      costoTotal,
      kmTotales,
      promedioCostoKm: Math.round(promedioCostoKm),
    };
  }, [filteredViajes]);

  const viajesPorCiudad = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredViajes.forEach((v) => {
      grouped[v.ciudadDestino] = (grouped[v.ciudadDestino] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, viajes]) => ({ name, viajes }));
  }, [filteredViajes]);

  const costoPorVehiculo = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredViajes.forEach((v) => {
      grouped[v.vehiculoId] = (grouped[v.vehiculoId] || 0) + v.costoTotal;
    });
    return Object.entries(grouped)
      .map(([vehiculoId, costo]) => {
        const vehiculo = vehiculos.find((vh) => vh.id === vehiculoId);
        return { name: vehiculo?.placa || vehiculoId, costo };
      })
      .sort((a, b) => b.costo - a.costo);
  }, [filteredViajes, vehiculos]);

  const despachoEstados = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredDespachos.forEach((d) => {
      grouped[d.estado] = (grouped[d.estado] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredDespachos]);

  const generateWeekLabels = useCallback(() => {
    const weeks: string[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      weeks.push(`S${8 - i}`);
    }
    return weeks;
  }, []);

  const tendenciaCostos = useMemo(() => {
    const weeks = generateWeekLabels();
    return weeks.map((week, i) => {
      const weekViajes = filteredViajes.filter((_, idx) => idx % 8 === i);
      const costo = weekViajes.reduce((acc, v) => acc + v.costoTotal, 0);
      return { name: week, costo };
    });
  }, [filteredViajes, generateWeekLabels]);

  const kmPorSemana = useMemo(() => {
    const weeks = generateWeekLabels();
    return weeks.map((week, i) => {
      const weekViajes = filteredViajes.filter((_, idx) => idx % 8 === i);
      const km = weekViajes.reduce((acc, v) => acc + v.kmRecorridos, 0);
      return { name: week, km };
    });
  }, [filteredViajes, generateWeekLabels]);

  const topConductores = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredViajes.forEach((v) => {
      grouped[v.conductorNombre] = (grouped[v.conductorNombre] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, viajes]) => ({ name, viajes }))
      .sort((a, b) => b.viajes - a.viajes);
  }, [filteredViajes]);

  const consumoCombustible = useMemo(() => {
    const weeks = generateWeekLabels();
    return weeks.map((week, i) => {
      const weekViajes = filteredViajes.filter((_, idx) => idx % 8 === i);
      const galones = weekViajes.reduce((acc, v) => acc + v.consumoGalones, 0);
      const costo = weekViajes.reduce((acc, v) => acc + v.costoCombustible, 0);
      return { name: week, galones, costo };
    });
  }, [filteredViajes, generateWeekLabels]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Cargando dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Gerencial</h1>
          <p className="text-sm text-muted-foreground">
            Resumen general de operaciones de flota
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Select value={ciudad} onValueChange={(v) => v && setCiudad(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {CIUDADES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vehiculoId} onValueChange={(v) => v && setVehiculoId(v)}>
            <SelectTrigger className="w-[160px]">
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
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Viajes"
          value={kpis.totalViajes}
          icon={Truck}
          trend="up"
        />
        <KpiCard
          title="Costo Total"
          value={formatCurrency(kpis.costoTotal)}
          icon={DollarSign}
          trend="up"
        />
        <KpiCard
          title="Km Totales"
          value={kpis.kmTotales.toLocaleString("es-CO")}
          unit="km"
          icon={Route}
          trend="up"
        />
        <KpiCard
          title="Promedio Costo/Km"
          value={formatCurrency(kpis.promedioCostoKm)}
          icon={TrendingDown}
          trend="down"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Viajes por ciudad */}
        <Card>
          <CardHeader>
            <CardTitle>Viajes por Ciudad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={viajesPorCiudad}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="viajes" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. Costo total por vehículo */}
        <Card>
          <CardHeader>
            <CardTitle>Costo Total por Vehículo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costoPorVehiculo} layout="vertical">
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Bar dataKey="costo" fill={COLORS.amber} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. Estado de despachos */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Despachos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={despachoEstados}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {despachoEstados.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Tendencia de costos semanal */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Costos Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendenciaCostos}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Line
                  type="monotone"
                  dataKey="costo"
                  stroke={COLORS.red}
                  strokeWidth={2}
                  dot={{ fill: COLORS.red }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 5. Km recorridos por semana */}
        <Card>
          <CardHeader>
            <CardTitle>Km Recorridos por Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={kmPorSemana}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value ?? 0).toLocaleString("es-CO")} km`} />
                <Area
                  type="monotone"
                  dataKey="km"
                  stroke={COLORS.emerald}
                  fill={COLORS.emerald}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 6. Top conductores por viajes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Conductores por Viajes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topConductores} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="viajes" fill={COLORS.violet} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 7. Consumo de combustible (dual Y axis) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Consumo de Combustible</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={consumoCombustible}>
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === "galones"
                      ? `${value} gal`
                      : formatCurrency(Number(value ?? 0))
                  }
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="galones"
                  stroke={COLORS.blue}
                  strokeWidth={2}
                  name="Galones"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="costo"
                  stroke={COLORS.amber}
                  strokeWidth={2}
                  name="Costo"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
