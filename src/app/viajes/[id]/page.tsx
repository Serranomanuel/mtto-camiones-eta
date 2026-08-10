"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useViajes } from "@/hooks/use-viajes";
import { useVehiculos } from "@/hooks/use-vehiculos";
import { useConductores } from "@/hooks/use-conductores";
import { useRutas } from "@/hooks/use-rutas";
import { useDespachos } from "@/hooks/use-despachos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { ciudadesCoordenadas } from "@/lib/ciudades";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("@/components/shared/MapView").then(m => m.MapView), { ssr: false });

export default function ViajeDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const { data: viajes, loading } = useViajes();
  const { data: vehiculos } = useVehiculos();
  const { data: conductores } = useConductores();
  const { data: rutas } = useRutas();
  const { data: despachos } = useDespachos();

  const viaje = viajes.find((v) => v.id === id);

  const vehiculo = useMemo(() => {
    if (!viaje) return null;
    return vehiculos.find((v) => v.id === viaje.vehiculoId) || null;
  }, [vehiculos, viaje]);

  const conductor = useMemo(() => {
    if (!viaje) return null;
    return conductores.find((c) => c.id === viaje.conductorId) || null;
  }, [conductores, viaje]);

  const ruta = useMemo(() => {
    if (!viaje) return null;
    return rutas.find((r) => r.id === viaje.rutaId) || null;
  }, [rutas, viaje]);

  const despachosViaje = useMemo(() => {
    if (!viaje) return [];
    return despachos.filter((d) => viaje.despachosIncluidos.includes(d.id));
  }, [despachos, viaje]);

  const tiempoRecorrido = useMemo(() => {
    if (!viaje || !viaje.horaSalida || !viaje.horaLlegada) return null;
    const [sh, sm] = viaje.horaSalida.split(":").map(Number);
    const [lh, lm] = viaje.horaLlegada.split(":").map(Number);
    const diff = (lh * 60 + lm) - (sh * 60 + sm);
    if (diff < 0) return null;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }, [viaje]);

  const mapData = useMemo(() => {
    if (!viaje) return null;
    const origen = ruta?.origen || viaje.direccionOrigen;
    const destino = ruta?.destino || viaje.ciudadDestino;
    const origenCoord = ciudadesCoordenadas[origen];
    const destinoCoord = ciudadesCoordenadas[destino];
    if (!origenCoord || !destinoCoord) return null;
    return {
      center: [(origenCoord[0] + destinoCoord[0]) / 2, (origenCoord[1] + destinoCoord[1]) / 2] as [number, number],
      markers: [
        { position: origenCoord, label: origen, type: "origen" as const },
        { position: destinoCoord, label: destino, type: "destino" as const },
      ],
      route: [origenCoord, destinoCoord],
    };
  }, [viaje, ruta]);

  if (loading) {
    return <SkeletonLoader variant="detail" count={8} />;
  }

  if (!viaje) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Viaje no encontrado</p>
        <Link href="/viajes">
          <Button variant="outline"><ArrowLeft className="size-4 mr-1" /> Volver</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/viajes">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Viaje {viaje.id}</h1>
            <p className="text-muted-foreground">{viaje.fecha}</p>
          </div>
        </div>
        <StatusBadge status={viaje.estado} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del viaje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DataField label="ID" value={viaje.id} />
            <DataField label="Fecha" value={viaje.fecha} />
            <DataField label="Estado" value={viaje.estado} />
            <DataField label="Ruta" value={ruta ? `${ruta.origen} → ${ruta.destino} (${ruta.via})` : viaje.rutaId} />
            <DataField label="Vehículo" value={vehiculo ? `${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.modelo}` : viaje.vehiculoId} />
            <DataField label="Conductor" value={conductor?.nombreCompleto || viaje.conductorNombre} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Despachos incluidos ({despachosViaje.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {despachosViaje.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay despachos incluidos</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despachosViaje.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.id}</TableCell>
                    <TableCell>{d.fecha}</TableCell>
                    <TableCell>{d.descripcionCarga}</TableCell>
                    <TableCell>{d.ciudad}</TableCell>
                    <TableCell><StatusBadge status={d.estado} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataField label="Hora salida" value={viaje.horaSalida || "-"} />
            <DataField label="Hora llegada" value={viaje.horaLlegada || "-"} />
            <DataField label="Tiempo recorrido" value={tiempoRecorrido || `${viaje.tiempoRecorridoMin} min`} />
            <DataField label="KM Inicial" value={viaje.kmInicial.toLocaleString()} />
            <DataField label="KM Final" value={viaje.kmFinal.toLocaleString()} />
            <DataField label="KM Recorridos" value={viaje.kmRecorridos.toLocaleString()} />
            <DataField label="Cantidad peajes" value={String(viaje.cantidadPeajes)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Costos desglosados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataField label="Consumo galones" value={viaje.consumoGalones.toFixed(2)} />
            <DataField label="Costo combustible" value={`$${viaje.costoCombustible.toLocaleString()}`} />
            <DataField label="Costo peajes" value={`$${viaje.costoPeajes.toLocaleString()}`} />
            <DataField label="Costo total" value={`$${viaje.costoTotal.toLocaleString()}`} highlight />
          </div>
        </CardContent>
      </Card>

      {mapData && (
        <Card>
          <CardHeader>
            <CardTitle>Mapa con ruta</CardTitle>
          </CardHeader>
          <CardContent>
            <MapView
              center={mapData.center}
              markers={mapData.markers}
              route={mapData.route}
              className="h-[400px] w-full rounded-lg border overflow-hidden"
            />
          </CardContent>
        </Card>
      )}

      {viaje.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{viaje.observaciones}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DataField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${highlight ? "text-lg font-bold" : ""}`}>{value}</p>
    </div>
  );
}
