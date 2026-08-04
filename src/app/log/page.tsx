"use client";

import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Search, ScrollText } from "lucide-react";
import { useLog } from "@/hooks/use-log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Button } from "@/components/ui/button";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import type { LogEntry } from "@/types/etalum";

const ITEMS_PER_PAGE = 15;

const ACCIONES: LogEntry["accion"][] = ["Crear", "Editar", "Eliminar", "Importar", "Generar"];

const MODULOS = [
  "Vehículos",
  "Conductores",
  "Viajes",
  "Despachos",
  "Obras",
  "Clientes",
  "Rutas",
  "Peajes",
  "Combustible",
  "Reportes",
];

export default function LogPage() {
  const { data, loading } = useLog();

  const [search, setSearch] = useState("");
  const [filterUsuario, setFilterUsuario] = useState("all");
  const [filterModulo, setFilterModulo] = useState("all");
  const [filterAccion, setFilterAccion] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [page, setPage] = useState(1);

  const usuarios = useMemo(() => {
    const set = new Set(data.map((l) => l.usuario));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (filterUsuario !== "all" && item.usuario !== filterUsuario) return false;
      if (filterModulo !== "all" && item.modulo !== filterModulo) return false;
      if (filterAccion !== "all" && item.accion !== filterAccion) return false;
      if (filterDateRange.from) {
        const fecha = parseISO(item.fechaHora);
        if (fecha < filterDateRange.from) return false;
      }
      if (filterDateRange.to) {
        const fecha = parseISO(item.fechaHora);
        if (fecha > filterDateRange.to) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const match =
          item.usuario.toLowerCase().includes(q) ||
          item.modulo.toLowerCase().includes(q) ||
          item.detalle.toLowerCase().includes(q) ||
          item.idRegistro.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [data, filterUsuario, filterModulo, filterAccion, filterDateRange, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Log de Auditoría</h1>
        </div>
        <SkeletonLoader variant="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="size-6" />
          <h1 className="text-2xl font-bold">Log de Auditoría</h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por usuario, módulo, detalle..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <DateRangePicker
              value={filterDateRange}
              onChange={(v) => { setFilterDateRange(v); setPage(1); }}
            />

            <Select value={filterUsuario} onValueChange={(v) => { setFilterUsuario(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {usuarios.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterModulo} onValueChange={(v) => { setFilterModulo(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {MODULOS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAccion} onValueChange={(v) => { setFilterAccion(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {ACCIONES.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Registros ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Fecha/Hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>ID Registro</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No se encontraron registros
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((entry, idx) => (
                    <TableRow key={`${entry.fechaHora}-${idx}`}>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {format(parseISO(entry.fechaHora), "dd MMM yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">{entry.usuario}</TableCell>
                      <TableCell>{entry.modulo}</TableCell>
                      <TableCell>
                        <StatusBadge status={entry.accion} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {entry.idRegistro}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {entry.detalle}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                Página {safePage} de {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
