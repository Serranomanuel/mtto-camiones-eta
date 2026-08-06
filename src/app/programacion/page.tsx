"use client";

import { useState, useMemo, useCallback } from "react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useDespachos } from "@/hooks/use-despachos";
import { useObras } from "@/hooks/use-obras";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SearchAutocomplete } from "@/components/shared/SearchAutocomplete";
import { FileUpload } from "@/components/shared/FileUpload";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import type { Despacho } from "@/types/etalum";

const initialForm: Omit<Despacho, "id" | "dia" | "registradoPor" | "fechaRegistro"> & {
  nombreObra: string;
  ciudad: string;
} = {
  fecha: format(new Date(), "yyyy-MM-dd"),
  obraId: "",
  nombreObra: "",
  ciudad: "",
  clienteId: "",
  descripcionCarga: "",
  areaResponsable: "Ensamble",
  memo: "",
  cot: "",
  responsableAutoriza: "",
  estado: "Programado",
  viajeAsignadoId: null,
  observaciones: "",
};

const areas: Despacho["areaResponsable"][] = [
  "Ensamble",
  "Vidrio",
  "Almacén",
  "Aluminio",
  "Acero",
];

const estados: Despacho["estado"][] = [
  "Programado",
  "En preparación",
  "Despachado",
  "Entregado",
  "Cancelado",
];

const ciudades = ["Bogotá", "Barranquilla", "Cartagena", "Santa Marta", "Bucaramanga"];

export default function ProgramacionPage() {
  const { data: despachos, loading, create, update, delete: remove } = useDespachos();
  const { data: obras } = useObras();

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [filterCiudad, setFilterCiudad] = useState<string>("");
  const [filterArea, setFilterArea] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

  const getDia = (fecha: string): string => {
    try {
      return format(parseISO(fecha), "EEEE", { locale: es });
    } catch {
      return "";
    }
  };

  const filtered = useMemo(() => {
    return despachos.filter((d) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          d.id.toLowerCase().includes(q) ||
          d.nombreObra.toLowerCase().includes(q) ||
          d.descripcionCarga.toLowerCase().includes(q) ||
          d.memo.toLowerCase().includes(q) ||
          d.responsableAutoriza.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (dateRange.from && dateRange.to) {
        try {
          const fecha = parseISO(d.fecha);
          if (!isWithinInterval(fecha, { start: dateRange.from, end: dateRange.to })) return false;
        } catch {
          return false;
        }
      }
      if (filterCiudad && filterCiudad !== "all" && d.ciudad !== filterCiudad) return false;
      if (filterArea && filterArea !== "all" && d.areaResponsable !== filterArea) return false;
      if (filterEstado && filterEstado !== "all" && d.estado !== filterEstado) return false;
      return true;
    });
  }, [despachos, search, dateRange, filterCiudad, filterArea, filterEstado]);

  const obraOptions = useMemo(
    () =>
      obras.map((o) => ({
        value: o.id,
        label: `${o.nombre} — ${o.ciudad}`,
      })),
    [obras]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...initialForm, fecha: format(new Date(), "yyyy-MM-dd") });
    setModalOpen(true);
  };

  const openEdit = (d: Despacho) => {
    setEditingId(d.id);
    setForm({
      fecha: d.fecha,
      obraId: d.obraId,
      nombreObra: d.nombreObra,
      ciudad: d.ciudad,
      clienteId: d.clienteId,
      descripcionCarga: d.descripcionCarga,
      areaResponsable: d.areaResponsable,
      memo: d.memo,
      cot: d.cot,
      responsableAutoriza: d.responsableAutoriza,
      estado: d.estado,
      viajeAsignadoId: d.viajeAsignadoId,
      observaciones: d.observaciones,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const dia = getDia(form.fecha);
    const now = new Date().toISOString();
    if (editingId) {
      await update(editingId, { ...form, dia });
    } else {
      await create({
        ...form,
        dia,
        registradoPor: "admin",
        fechaRegistro: now,
      });
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

  const handleObraSelect = (obraId: string) => {
    const obra = obras.find((o) => o.id === obraId);
    if (obra) {
      setForm((prev) => ({
        ...prev,
        obraId,
        nombreObra: obra.nombre,
        ciudad: obra.ciudad,
        clienteId: obra.clienteId,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        obraId,
        nombreObra: "",
        ciudad: "",
        clienteId: "",
      }));
    }
  };

  const handleExcelImport = useCallback(
    async (file: File) => {
      setImporting(true);
      setImportResult(null);

      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (rows.length === 0) {
          setImportResult({ success: 0, errors: ["El archivo está vacío"] });
          return;
        }

        const requiredColumns = ["fecha", "obra", "cliente", "area", "descripcion"];
        const firstRowKeys = Object.keys(rows[0]).map((k) => k.toLowerCase().trim());
        const missingColumns = requiredColumns.filter(
          (col) => !firstRowKeys.some((k) => k.includes(col))
        );

        if (missingColumns.length > 0) {
          setImportResult({
            success: 0,
            errors: [`Faltan columnas requeridas: ${missingColumns.join(", ")}`],
          });
          return;
        }

        const findColumn = (row: Record<string, unknown>, search: string): string => {
          const key = Object.keys(row).find((k) => k.toLowerCase().includes(search));
          if (!key) return "";
          const val = row[key];
          return typeof val === "string" ? val : String(val ?? "");
        };

        const errors: string[] = [];
        let successCount = 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            const fechaRaw = findColumn(row, "fecha");
            let fecha = fechaRaw;
            if (fechaRaw.includes("/")) {
              const parts = fechaRaw.split("/");
              if (parts.length === 3) {
                fecha = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
              }
            }

            const nombreObra = findColumn(row, "obra");
            const obra = obras.find(
              (o) => o.nombre.toLowerCase() === nombreObra.toLowerCase()
            );

            const descripcion = findColumn(row, "descripcion") || findColumn(row, "carga");
            const area = findColumn(row, "area");
            const memo = findColumn(row, "memo");
            const cot = findColumn(row, "cot");
            const responsable = findColumn(row, "responsable") || findColumn(row, "autoriza");

            const validAreas: Despacho["areaResponsable"][] = [
              "Ensamble", "Vidrio", "Almacén", "Aluminio", "Acero",
            ];
            const areaFinal = validAreas.find(
              (a) => a.toLowerCase() === area.toLowerCase()
            ) || "Ensamble";

            await create({
              fecha,
              dia: getDia(fecha),
              obraId: obra?.id || "",
              nombreObra: obra?.nombre || nombreObra,
              ciudad: obra?.ciudad || "",
              clienteId: obra?.clienteId || "",
              descripcionCarga: descripcion,
              areaResponsable: areaFinal,
              memo,
              cot,
              responsableAutoriza: responsable,
              estado: "Programado",
              viajeAsignadoId: null,
              observaciones: "",
              registradoPor: "importación",
              fechaRegistro: new Date().toISOString(),
            });
            successCount++;
          } catch {
            errors.push(`Fila ${i + 2}: Error al procesar`);
          }
        }

        setImportResult({ success: successCount, errors });
      } catch {
        setImportResult({ success: 0, errors: ["Error al leer el archivo Excel"] });
      } finally {
        setImporting(false);
      }
    },
    [create, obras]
  );

  const closeImport = () => {
    setImportOpen(false);
    setImportResult(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Programación / Despachos</h1>
        </div>
        <SkeletonLoader variant="table-row" count={10} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Programación / Despachos</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="size-4 mr-1" />
            Importar desde Excel
          </Button>
          <Button onClick={openCreate}>
            <Plus className="size-4 mr-1" />
            Nuevo Despacho
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="space-y-1.5">
              <Label>Búsqueda global</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ID, obra, carga, memo..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Rango de fechas</Label>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Select value={filterCiudad} onValueChange={(v) => v && setFilterCiudad(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {ciudades.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Área</Label>
              <Select value={filterArea} onValueChange={(v) => v && setFilterArea(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={filterEstado} onValueChange={(v) => v && setFilterEstado(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {estados.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Día</TableHead>
              <TableHead>Obra</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Memo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Viaje Asignado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  No se encontraron despachos.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.id}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format(parseISO(d.fecha), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="capitalize">{d.dia}</TableCell>
                  <TableCell>{d.nombreObra}</TableCell>
                  <TableCell>{d.ciudad}</TableCell>
                  <TableCell>{d.areaResponsable}</TableCell>
                  <TableCell className="font-mono text-xs">{d.memo}</TableCell>
                  <TableCell>
                    <StatusBadge status={d.estado} />
                  </TableCell>
                  <TableCell>
                    {d.viajeAsignadoId ? (
                      <span className="font-mono text-xs">{d.viajeAsignadoId}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(d)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openDelete(d.id)}>
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

      <p className="text-sm text-muted-foreground">
        Mostrando {filtered.length} de {despachos.length} despachos
      </p>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Despacho" : "Nuevo Despacho"}
        onSubmit={handleSave}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Obra</Label>
            <SearchAutocomplete
              options={obraOptions}
              value={form.obraId}
              onChange={handleObraSelect}
              placeholder="Buscar obra..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nombre Obra (auto)</Label>
            <Input value={form.nombreObra} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Ciudad (auto)</Label>
            <Input value={form.ciudad} disabled />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descripción Carga</Label>
            <Input
              value={form.descripcionCarga}
              onChange={(e) => setForm({ ...form, descripcionCarga: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Área Responsable</Label>
            <Select
              value={form.areaResponsable}
              onValueChange={(val) =>
                setForm({ ...form, areaResponsable: val as Despacho["areaResponsable"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Memo</Label>
            <Input
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>COT</Label>
            <Input value={form.cot} onChange={(e) => setForm({ ...form, cot: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Responsable Autoriza</Label>
            <Input
              value={form.responsableAutoriza}
              onChange={(e) => setForm({ ...form, responsableAutoriza: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select
              value={form.estado}
              onValueChange={(val) => setForm({ ...form, estado: val as Despacho["estado"] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {estados.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observaciones</Label>
            <Input
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </div>
        </div>
      </FormModal>

      <Dialog open={importOpen} onOpenChange={closeImport}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar desde Excel
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {!importResult ? (
              <>
                <p className="text-sm text-muted-foreground">
                  El archivo debe contener las columnas: <strong>fecha, obra, cliente, area, descripcion</strong> (y opcionales: memo, cot, responsable).
                </p>
                <FileUpload accept=".xlsx,.xls" onFileSelect={handleExcelImport} />
                {importing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Procesando archivo...
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {importResult.success} despacho{importResult.success !== 1 ? "s" : ""} importado{importResult.success !== 1 ? "s" : ""}
                  </span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        {importResult.errors.length} error{importResult.errors.length !== 1 ? "es" : ""}
                      </span>
                    </div>
                    <div className="max-h-32 overflow-y-auto rounded-md bg-destructive/5 p-2">
                      {importResult.errors.map((err, i) => (
                        <p key={i} className="text-xs text-destructive">{err}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={closeImport}>
              {importResult ? "Cerrar" : "Cancelar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeletingId(null);
        }}
        title="Eliminar despacho"
        description="¿Estás seguro de que deseas eliminar este despacho? Esta acción no se puede deshacer."
      />
    </div>
  );
}
