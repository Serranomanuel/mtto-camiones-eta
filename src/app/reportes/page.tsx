"use client";

import { useState, useMemo, useCallback } from "react";
import { FileText, FileSpreadsheet, Printer, ChevronRight, ChevronLeft } from "lucide-react";
import { useViajes } from "@/hooks/use-viajes";
import { useDespachos } from "@/hooks/use-despachos";
import { useVehiculos } from "@/hooks/use-vehiculos";
import { useConductores } from "@/hooks/use-conductores";
import { useClientes } from "@/hooks/use-clientes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";

const CIUDADES = ["Bogotá", "Barranquilla", "Cartagena", "Santa Marta", "Bucaramanga"];

type ReportType = "semanal" | "mensual" | "anual" | "vehiculo" | "conductor" | "cliente" | "ciudad";

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
  { value: "anual", label: "Anual" },
  { value: "vehiculo", label: "Por Vehículo" },
  { value: "conductor", label: "Por Conductor" },
  { value: "cliente", label: "Por Cliente" },
  { value: "ciudad", label: "Por Ciudad" },
];

interface ReportRow {
  id: string;
  fecha: string;
  descripcion: string;
  referencia: string;
  kmRecorridos: number;
  costoTotal: number;
  [key: string]: unknown;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameWeek(dateStr: string, refDate: Date): boolean {
  const d = new Date(dateStr);
  const weekStart = getWeekStart(refDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return d >= weekStart && d <= weekEnd;
}

function isSameMonth(dateStr: string, year: number, month: number): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() === month;
}

function isSameYear(dateStr: string, year: number): boolean {
  return new Date(dateStr).getFullYear() === year;
}

function isInRange(dateStr: string, from?: Date, to?: Date): boolean {
  if (!from || !to) return true;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const f = new Date(from);
  f.setHours(0, 0, 0, 0);
  const t = new Date(to);
  t.setHours(23, 59, 59, 999);
  return d >= f && d <= t;
}

const formatCOP = (value: number) => `$${value.toLocaleString("es-CO")}`;

export default function ReportesPage() {
  const [step, setStep] = useState(1);
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedVehiculo, setSelectedVehiculo] = useState("all");
  const [selectedConductor, setSelectedConductor] = useState("all");
  const [selectedCliente, setSelectedCliente] = useState("all");
  const [selectedCiudad, setSelectedCiudad] = useState("all");

  const { data: viajes, loading: loadingViajes } = useViajes();
  const { data: despachos, loading: loadingDespachos } = useDespachos();
  const { data: vehiculos } = useVehiculos();
  const { data: conductores } = useConductores();
  const { data: clientes } = useClientes();

  const loading = loadingViajes || loadingDespachos;

  const reportLabel = useMemo(() => {
    return REPORT_TYPES.find((r) => r.value === reportType)?.label ?? "";
  }, [reportType]);

  const resetFilters = useCallback(() => {
    setDateRange({ from: undefined, to: undefined });
    setSelectedVehiculo("all");
    setSelectedConductor("all");
    setSelectedCliente("all");
    setSelectedCiudad("all");
  }, []);

  const handleReportTypeChange = useCallback((val: string) => {
    setReportType(val as ReportType);
    resetFilters();
  }, [resetFilters]);

  const filteredData = useMemo<{ rows: ReportRow[]; type: "viajes" | "despachos" }>(() => {
    if (!reportType) return { rows: [], type: "viajes" };

    if (reportType === "cliente") {
      let filtered = despachos;
      if (dateRange.from && dateRange.to) {
        filtered = filtered.filter((d) => isInRange(d.fecha, dateRange.from, dateRange.to));
      }
      if (selectedCliente !== "all") {
        filtered = filtered.filter((d) => d.clienteId === selectedCliente);
      }
      const rows: ReportRow[] = filtered.map((d) => ({
        id: d.id,
        fecha: d.fecha,
        descripcion: d.descripcionCarga,
        referencia: d.nombreObra,
        kmRecorridos: 0,
        costoTotal: 0,
        cliente: d.clienteId,
        ciudad: d.ciudad,
        estado: d.estado,
      }));
      return { rows, type: "despachos" };
    }

    let filtered = viajes;
    if (reportType === "semanal") {
      const now = new Date();
      filtered = filtered.filter((v) => isSameWeek(v.fecha, now));
    } else if (reportType === "mensual") {
      const now = new Date();
      filtered = filtered.filter((v) => isSameMonth(v.fecha, now.getFullYear(), now.getMonth()));
    } else if (reportType === "anual") {
      const now = new Date();
      filtered = filtered.filter((v) => isSameYear(v.fecha, now.getFullYear()));
    } else if (reportType === "vehiculo") {
      if (selectedVehiculo !== "all") {
        filtered = filtered.filter((v) => v.vehiculoId === selectedVehiculo);
      }
    } else if (reportType === "conductor") {
      if (selectedConductor !== "all") {
        filtered = filtered.filter((v) => v.conductorId === selectedConductor);
      }
    } else if (reportType === "ciudad") {
      if (selectedCiudad !== "all") {
        filtered = filtered.filter((v) => v.ciudadDestino === selectedCiudad);
      }
    }

    if (dateRange.from && dateRange.to && (reportType === "vehiculo" || reportType === "conductor" || reportType === "ciudad")) {
      filtered = filtered.filter((v) => isInRange(v.fecha, dateRange.from, dateRange.to));
    }

    const rows: ReportRow[] = filtered.map((v) => ({
      id: v.id,
      fecha: v.fecha,
      descripcion: `${v.direccionOrigen} → ${v.direccionDestino}`,
      referencia: v.conductorNombre,
      kmRecorridos: v.kmRecorridos,
      costoTotal: v.costoTotal,
      placa: v.placa,
      ciudad: v.ciudadDestino,
      conductor: v.conductorNombre,
      vehiculoId: v.vehiculoId,
      conductorId: v.conductorId,
      costoPeajes: v.costoPeajes,
      costoCombustible: v.costoCombustible,
      consumoGalones: v.consumoGalones,
      estado: v.estado,
    }));
    return { rows, type: "viajes" };
  }, [reportType, viajes, despachos, dateRange, selectedVehiculo, selectedConductor, selectedCliente, selectedCiudad]);

  const summary = useMemo(() => {
    const rows = filteredData.rows;
    if (filteredData.type === "viajes") {
      const totalKm = rows.reduce((sum, r) => sum + (r.kmRecorridos as number), 0);
      const totalCosto = rows.reduce((sum, r) => sum + (r.costoTotal as number), 0);
      const totalPeajes = rows.reduce((sum, r) => sum + ((r.costoPeajes as number) || 0), 0);
      const totalCombustible = rows.reduce((sum, r) => sum + ((r.costoCombustible as number) || 0), 0);
      const totalGalones = rows.reduce((sum, r) => sum + ((r.consumoGalones as number) || 0), 0);
      return {
        totalRegistros: rows.length,
        totalKm,
        totalCosto,
        totalPeajes,
        totalCombustible,
        totalGalones,
      };
    }
    return {
      totalRegistros: rows.length,
      totalKm: 0,
      totalCosto: 0,
      totalPeajes: 0,
      totalCombustible: 0,
      totalGalones: 0,
    };
  }, [filteredData]);

  const canProceed = useMemo(() => {
    if (step === 1) return !!reportType;
    if (step === 2) {
      if (!reportType) return false;
      if (reportType === "vehiculo" || reportType === "conductor" || reportType === "cliente" || reportType === "ciudad") {
        if (reportType === "vehiculo" && selectedVehiculo === "all") return false;
        if (reportType === "conductor" && selectedConductor === "all") return false;
        if (reportType === "cliente" && selectedCliente === "all") return false;
        if (reportType === "ciudad" && selectedCiudad === "all") return false;
      }
      return true;
    }
    return true;
  }, [step, reportType, selectedVehiculo, selectedConductor, selectedCliente, selectedCiudad]);

  const handleExportPDF = () => {
    console.log("Exportar PDF - Reporte:", reportLabel, "Datos:", filteredData.rows, "Resumen:", summary);
  };

  const handleExportExcel = () => {
    console.log("Exportar Excel - Reporte:", reportLabel, "Datos:", filteredData.rows, "Resumen:", summary);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center gap-2 text-sm">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center size-8 rounded-full text-xs font-bold transition-colors ${
              step === s
                ? "bg-primary text-primary-foreground"
                : step > s
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s}
          </div>
          {s < 4 && <div className={`w-12 h-px ${step > s ? "bg-emerald-500" : "bg-muted"}`} />}
        </div>
      ))}
    </div>
  );

  const renderStepLabels = () => {
    const labels = ["Tipo de Reporte", "Filtros", "Vista Previa", "Acciones"];
    return (
      <div className="flex gap-2 text-xs text-muted-foreground">
        {labels.map((label, i) => (
          <span key={label} className={step === i + 1 ? "text-foreground font-medium" : ""}>
            {label}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Generador de Reportes</h1>
        </div>
        <SkeletonLoader variant="table-row" count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Generador de Reportes</h1>
        {renderStepIndicator()}
      </div>
      {renderStepLabels()}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Seleccionar Tipo de Reporte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label>Tipo de reporte</Label>
              <Select value={reportType} onValueChange={(v) => v && handleReportTypeChange(v)}>
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Seleccionar tipo de reporte" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>
                      {rt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reportType && (
                <p className="text-sm text-muted-foreground">
                  {reportType === "semanal" && "Muestra los viajes de la semana actual con sus costos."}
                  {reportType === "mensual" && "Muestra los viajes del mes actual con sus costos."}
                  {reportType === "anual" && "Muestra los viajes del año actual con sus costos."}
                  {reportType === "vehiculo" && "Filtra viajes por vehículo específico, muestra totales de km y costos."}
                  {reportType === "conductor" && "Filtra viajes por conductor específico, muestra totales de km y costos."}
                  {reportType === "cliente" && "Filtra despachos por cliente, muestra resumen de despachos."}
                  {reportType === "ciudad" && "Filtra viajes por ciudad de destino, muestra totales de km y costos."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 2: Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              {(reportType === "vehiculo" || reportType === "conductor" || reportType === "cliente" || reportType === "ciudad") && (
                <div className="space-y-1.5">
                  <Label>Rango de fechas (opcional)</Label>
                  <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>
              )}

              {reportType === "vehiculo" && (
                <div className="space-y-1.5">
                  <Label>Vehículo</Label>
                  <Select value={selectedVehiculo} onValueChange={(v) => v && setSelectedVehiculo(v)}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Seleccionar vehículo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {vehiculos.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.placa} - {v.marca} {v.modelo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {reportType === "conductor" && (
                <div className="space-y-1.5">
                  <Label>Conductor</Label>
                  <Select value={selectedConductor} onValueChange={(v) => v && setSelectedConductor(v)}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Seleccionar conductor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {conductores.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombreCompleto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {reportType === "cliente" && (
                <div className="space-y-1.5">
                  <Label>Cliente</Label>
                  <Select value={selectedCliente} onValueChange={(v) => v && setSelectedCliente(v)}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {reportType === "ciudad" && (
                <div className="space-y-1.5">
                  <Label>Ciudad</Label>
                  <Select value={selectedCiudad} onValueChange={(v) => v && setSelectedCiudad(v)}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Seleccionar ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {CIUDADES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(reportType === "semanal" || reportType === "mensual" || reportType === "anual") && (
                <p className="text-sm text-muted-foreground py-2">
                  Este reporte muestra datos automáticamente filtrados por período. No se requieren filtros adicionales.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paso 3: Vista Previa - {reportLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card size="sm">
                  <CardContent className="pt-2">
                    <p className="text-xs text-muted-foreground">Registros</p>
                    <p className="text-2xl font-bold">{summary.totalRegistros}</p>
                  </CardContent>
                </Card>
                {filteredData.type === "viajes" && (
                  <>
                    <Card size="sm">
                      <CardContent className="pt-2">
                        <p className="text-xs text-muted-foreground">KM Recorridos</p>
                        <p className="text-2xl font-bold">{summary.totalKm.toLocaleString("es-CO")}</p>
                      </CardContent>
                    </Card>
                    <Card size="sm">
                      <CardContent className="pt-2">
                        <p className="text-xs text-muted-foreground">Costo Total</p>
                        <p className="text-2xl font-bold">{formatCOP(summary.totalCosto)}</p>
                      </CardContent>
                    </Card>
                    <Card size="sm">
                      <CardContent className="pt-2">
                        <p className="text-xs text-muted-foreground">Galones</p>
                        <p className="text-2xl font-bold">{summary.totalGalones.toLocaleString("es-CO")}</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Referencia</TableHead>
                      {filteredData.type === "viajes" && (
                        <>
                          <TableHead className="text-right">KM</TableHead>
                          <TableHead className="text-right">Costo Total</TableHead>
                        </>
                      )}
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={filteredData.type === "viajes" ? 7 : 5} className="text-center text-muted-foreground py-8">
                          No hay datos para los filtros seleccionados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-mono text-xs">{row.id}</TableCell>
                          <TableCell>{row.fecha}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs">{row.descripcion}</TableCell>
                          <TableCell className="text-xs">{row.referencia}</TableCell>
                          {filteredData.type === "viajes" && (
                            <>
                              <TableCell className="text-right">{(row.kmRecorridos as number).toLocaleString("es-CO")}</TableCell>
                              <TableCell className="text-right">{formatCOP(row.costoTotal as number)}</TableCell>
                            </>
                          )}
                          <TableCell className="text-xs">{row.estado as string}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 4: Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-3 p-6 border rounded-lg hover:bg-muted/50 transition-colors">
                  <FileText className="size-10 text-red-500" />
                  <div className="text-center">
                    <p className="font-medium">Exportar PDF</p>
                    <p className="text-xs text-muted-foreground">Genera un archivo PDF del reporte</p>
                  </div>
                  <Button onClick={handleExportPDF} className="w-full">
                    Generar PDF
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-3 p-6 border rounded-lg hover:bg-muted/50 transition-colors">
                  <FileSpreadsheet className="size-10 text-emerald-600" />
                  <div className="text-center">
                    <p className="font-medium">Exportar Excel</p>
                    <p className="text-xs text-muted-foreground">Genera un archivo Excel del reporte</p>
                  </div>
                  <Button onClick={handleExportExcel} variant="outline" className="w-full">
                    Generar Excel
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-3 p-6 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Printer className="size-10 text-blue-600" />
                  <div className="text-center">
                    <p className="font-medium">Imprimir</p>
                    <p className="text-xs text-muted-foreground">Imprime el reporte directamente</p>
                  </div>
                  <Button onClick={handlePrint} variant="outline" className="w-full">
                    Imprimir
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-medium mb-2">Resumen del Reporte</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="ml-2 font-medium">{reportLabel}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Registros:</span>
                    <span className="ml-2 font-medium">{summary.totalRegistros}</span>
                  </div>
                  {filteredData.type === "viajes" && (
                    <>
                      <div>
                        <span className="text-muted-foreground">KM Totales:</span>
                        <span className="ml-2 font-medium">{summary.totalKm.toLocaleString("es-CO")}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Costo Total:</span>
                        <span className="ml-2 font-medium">{formatCOP(summary.totalCosto)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="size-4 mr-1" />
          Anterior
        </Button>
        <Button
          onClick={() => setStep((s) => Math.min(4, s + 1))}
          disabled={step === 4 || !canProceed}
        >
          Siguiente
          <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
