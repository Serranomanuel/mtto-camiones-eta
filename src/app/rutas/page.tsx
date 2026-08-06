"use client";

import { useState, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rutaSchema, type RutaFormData } from "@/lib/validations";
import { useRutas } from "@/hooks/use-rutas";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MapView, ciudadesCoordenadas } from "@/components/shared/MapView";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Ruta } from "@/types/etalum";
import { Plus, Pencil, Trash2, Map, X } from "lucide-react";

const emptyForm: RutaFormData = {
  origen: "",
  destino: "",
  via: "",
  distanciaKm: null,
  tiempoMin: null,
  peajeReferencia: null,
  linkGoogleMaps: "",
  observaciones: "",
};

function getCityCoords(name: string): [number, number] | undefined {
  const normalized = name.toLowerCase().trim();
  for (const [city, coords] of Object.entries(ciudadesCoordenadas)) {
    if (normalized.includes(city.toLowerCase())) return coords;
  }
  return undefined;
}

function getRouteCoords(ruta: Ruta): {
  center: [number, number];
  markers: Array<{ position: [number, number]; label: string; type: "origen" | "destino" }>;
  polyline: [number, number][];
} | null {
  const origenCoords = getCityCoords(ruta.origen);
  const destinoCoords = getCityCoords(ruta.destino);
  if (!origenCoords || !destinoCoords) return null;

  const center: [number, number] = [
    (origenCoords[0] + destinoCoords[0]) / 2,
    (origenCoords[1] + destinoCoords[1]) / 2,
  ];

  return {
    center,
    markers: [
      { position: origenCoords, label: ruta.origen, type: "origen" },
      { position: destinoCoords, label: ruta.destino, type: "destino" },
    ],
    polyline: [origenCoords, destinoCoords],
  };
}

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

export default function RutasPage() {
  const { data: rutas, loading, create, update, delete: deleteRuta } = useRutas();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const form = useForm<RutaFormData>({
    resolver: zodResolver(rutaSchema) as Resolver<RutaFormData>,
    defaultValues: emptyForm,
  });

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ruta | null>(null);
  const [selectedRuta, setSelectedRuta] = useState<Ruta | null>(null);
  const [fullscreenMapOpen, setFullscreenMapOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rutas.filter(
      (r) =>
        r.origen.toLowerCase().includes(q) ||
        r.destino.toLowerCase().includes(q) ||
        r.via.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [rutas, search]);

  const activeRuta = selectedRuta || filtered[0] || null;
  const mapData = activeRuta ? getRouteCoords(activeRuta) : null;

  function openCreate() {
    setEditingId(null);
    form.reset(emptyForm);
    setModalOpen(true);
  }

  function openEdit(r: Ruta) {
    setEditingId(r.id);
    form.reset({
      origen: r.origen,
      destino: r.destino,
      via: r.via,
      distanciaKm: r.distanciaKm,
      tiempoMin: r.tiempoMin,
      peajeReferencia: r.peajeReferencia,
      linkGoogleMaps: r.linkGoogleMaps,
      observaciones: r.observaciones,
    });
    setModalOpen(true);
  }

  async function onValid(data: RutaFormData) {
    if (editingId) {
      await update(editingId, data as Partial<Ruta>);
    } else {
      await create(data as Omit<Ruta, "id">);
    }
    setModalOpen(false);
  }

  async function handleDelete() {
    if (deleteTarget) {
      await deleteRuta(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  function handleSimular() {
    const distancia = Math.round(150 + Math.random() * 700);
    const tiempo = Math.round(distancia * (0.8 + Math.random() * 0.5));
    const peaje = Math.round((5000 + Math.random() * 40000) / 500) * 500;
    form.setValue("distanciaKm", distancia);
    form.setValue("tiempoMin", tiempo);
    form.setValue("peajeReferencia", peaje);
  }

  function handleRowClick(ruta: Ruta) {
    setSelectedRuta(ruta);
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <SkeletonLoader count={5} />
      </div>
    );
  }

  const tableContent = (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>Vía</TableHead>
            <TableHead className="text-right">Dist. KM</TableHead>
            <TableHead className="text-right">Tiempo Min</TableHead>
            <TableHead className="text-right">Peaje Ref.</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow
              key={r.id}
              className={`cursor-pointer transition-colors ${
                activeRuta?.id === r.id ? "bg-muted" : "hover:bg-muted/50"
              }`}
              onClick={() => handleRowClick(r)}
            >
              <TableCell className="font-mono text-xs">{r.id}</TableCell>
              <TableCell>{r.origen}</TableCell>
              <TableCell>{r.destino}</TableCell>
              <TableCell>{r.via}</TableCell>
              <TableCell className="text-right">{r.distanciaKm ?? "—"}</TableCell>
              <TableCell className="text-right">{r.tiempoMin ?? "—"}</TableCell>
              <TableCell className="text-right">{formatCurrency(r.peajeReferencia)}</TableCell>
              <TableCell>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {!isDesktop && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setSelectedRuta(r);
                        setFullscreenMapOpen(true);
                      }}
                    >
                      <Map className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(r)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setDeleteTarget(r)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No se encontraron rutas
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const mapContent = (
    <div className="h-full w-full">
      {mapData ? (
        <MapView
          center={mapData.center}
          markers={mapData.markers}
          route={mapData.polyline}
          className="h-full w-full min-h-[300px] rounded-lg border"
        />
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg border text-muted-foreground">
          Selecciona una ruta para ver en el mapa
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rutas</h1>
          <p className="text-muted-foreground">
            {filtered.length} ruta{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Ruta
        </Button>
      </div>

      <Input
        placeholder="Buscar por ID, origen, destino o vía..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="sm:max-w-xs"
      />

      {isDesktop ? (
        <div className="flex gap-6" style={{ height: "calc(100vh - 260px)", minHeight: "500px" }}>
          <div className="w-[40%] overflow-y-auto">{tableContent}</div>
          <div className="w-[60%] sticky top-0">{mapContent}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {tableContent}
          {activeRuta && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setFullscreenMapOpen(true)}
            >
              <Map className="mr-2 h-4 w-4" />
              Ver en mapa
            </Button>
          )}
        </div>
      )}

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Ruta" : "Nueva Ruta"}
        onSubmit={form.handleSubmit(onValid)}
        submitLabel={editingId ? "Actualizar" : "Crear"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origen">Origen</Label>
              <Input
                id="origen"
                {...form.register("origen")}
                className={form.formState.errors.origen ? "border-destructive" : ""}
                placeholder="Ciudad de origen"
              />
              {form.formState.errors.origen?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.origen.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="destino">Destino</Label>
              <Input
                id="destino"
                {...form.register("destino")}
                className={form.formState.errors.destino ? "border-destructive" : ""}
                placeholder="Ciudad de destino"
              />
              {form.formState.errors.destino?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.destino.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="via">Vía</Label>
            <Input
              id="via"
              {...form.register("via")}
              placeholder="Nombre de la vía"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkGoogleMaps">Link Google Maps</Label>
            <Input
              id="linkGoogleMaps"
              {...form.register("linkGoogleMaps")}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distanciaKm">Distancia KM</Label>
              <Input
                id="distanciaKm"
                type="number"
                {...form.register("distanciaKm", { valueAsNumber: true })}
                placeholder="—"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiempoMin">Tiempo Min</Label>
              <Input
                id="tiempoMin"
                type="number"
                {...form.register("tiempoMin", { valueAsNumber: true })}
                placeholder="—"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peajeReferencia">Peaje Ref.</Label>
              <Input
                id="peajeReferencia"
                type="number"
                {...form.register("peajeReferencia", { valueAsNumber: true })}
                placeholder="—"
              />
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={handleSimular} className="w-full">
            Simular cálculo
          </Button>
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Input
              id="observaciones"
              {...form.register("observaciones")}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar ruta"
        description={`¿Estás seguro de eliminar la ruta ${deleteTarget?.origen} → ${deleteTarget?.destino}? Esta acción no se puede deshacer.`}
      />

      <Dialog open={fullscreenMapOpen} onOpenChange={(v) => !v && setFullscreenMapOpen(false)}>
        <DialogContent className="max-w-full h-full sm:max-w-[90vw] sm:h-[90vh] p-0">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-background/90 backdrop-blur px-4 py-3 flex flex-row items-center justify-between">
            <DialogTitle>
              {activeRuta ? `${activeRuta.origen} → ${activeRuta.destino}` : "Mapa"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setFullscreenMapOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="w-full h-full pt-14">
            {mapData ? (
              <MapView
                center={mapData.center}
                markers={mapData.markers}
                route={mapData.polyline}
                className="h-full w-full rounded-none"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Sin datos de ubicación para esta ruta
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
