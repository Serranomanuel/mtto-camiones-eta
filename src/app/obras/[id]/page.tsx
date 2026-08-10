"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { useObras } from "@/hooks/use-obras";
import { useClientes } from "@/hooks/use-clientes";
import { useDespachos } from "@/hooks/use-despachos";
import { useViajes } from "@/hooks/use-viajes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FormModal } from "@/components/shared/FormModal";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Obra } from "@/types/etalum";

const CIUDADES = ["Bogotá", "Barranquilla", "Cartagena", "Santa Marta", "Bucaramanga"];

export default function ObraDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<Obra, "id"> | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const { data: obras, loading, update } = useObras();
  const { data: clientes } = useClientes();
  const { data: despachos } = useDespachos();
  const { data: viajes } = useViajes();

  const obra = obras.find((o) => o.id === id);

  const cliente = useMemo(() => {
    if (!obra) return null;
    return clientes.find((c) => c.id === obra.clienteId) || null;
  }, [obra, clientes]);

  const despachosObra = useMemo(() => {
    return despachos.filter((d) => d.obraId === id);
  }, [despachos, id]);

  const viajesObra = useMemo(() => {
    const despachoIds = new Set(despachosObra.map((d) => d.viajeAsignadoId).filter(Boolean));
    return viajes.filter((v) => despachoIds.has(v.id));
  }, [viajes, despachosObra]);

  const openEdit = () => {
    if (!obra) return;
    setForm({
      nombre: obra.nombre,
      torre: obra.torre,
      clienteId: obra.clienteId,
      ciudad: obra.ciudad,
      direccion: obra.direccion,
      estadoDireccion: obra.estadoDireccion,
      estadoObra: obra.estadoObra,
      fuente: obra.fuente,
      alias: obra.alias,
      observaciones: obra.observaciones,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (form && id) {
      await update(id, form);
    }
    setModalOpen(false);
  };

  if (loading) {
    return <SkeletonLoader variant="detail" count={8} />;
  }

  if (!obra) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Obra no encontrada</p>
        <Link href="/obras">
          <Button variant="outline"><ArrowLeft className="size-4 mr-1" /> Volver</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/obras">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{obra.nombre} - {obra.torre}</h1>
            <p className="text-muted-foreground">{obra.ciudad}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={obra.estadoObra} />
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="size-3.5 mr-1" /> Editar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la obra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DataField label="ID" value={obra.id} />
            <DataField label="Nombre" value={obra.nombre} />
            <DataField label="Torre" value={obra.torre} />
            <DataField label="Ciudad" value={obra.ciudad} />
            <DataField label="Dirección" value={obra.direccion || "No registrada"} />
            <DataField
              label="Estado dirección"
              value={obra.estadoDireccion}
              dot={obra.estadoDireccion === "Completo" ? "green" : "orange"}
            />
            <DataField label="Cliente" value={cliente?.nombre || obra.clienteId} />
            <DataField label="Fuente" value={obra.fuente || "-"} />
            <DataField label="Alias" value={obra.alias || "-"} />
            {obra.observaciones && (
              <div className="sm:col-span-2 lg:col-span-3">
                <DataField label="Observaciones" value={obra.observaciones} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Despachos asociados ({despachosObra.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {despachosObra.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay despachos registrados para esta obra</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despachosObra.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.id}</TableCell>
                    <TableCell>{d.fecha}</TableCell>
                    <TableCell>{d.descripcionCarga}</TableCell>
                    <TableCell>{d.areaResponsable}</TableCell>
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
          <CardTitle>Viajes asociados ({viajesObra.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {viajesObra.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay viajes asociados a los despachos de esta obra</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Conductor</TableHead>
                  <TableHead className="text-right">Km</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viajesObra.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.id}</TableCell>
                    <TableCell>{v.fecha}</TableCell>
                    <TableCell>{v.ciudadDestino}</TableCell>
                    <TableCell>{v.conductorNombre}</TableCell>
                    <TableCell className="text-right">{v.kmRecorridos.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${v.costoTotal.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={v.estado} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {form && (
        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Editar obra"
          onSubmit={handleSave}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Torre</Label>
              <Input value={form.torre} onChange={(e) => setForm({ ...form, torre: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select value={form.clienteId} onValueChange={(val) => val && setForm({ ...form, clienteId: val })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Select value={form.ciudad} onValueChange={(val) => val && setForm({ ...form, ciudad: val as Obra["ciudad"] })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CIUDADES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Dirección</Label>
              <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado dirección</Label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="estadoDireccion"
                    checked={form.estadoDireccion === "Completo"}
                    onChange={() => setForm({ ...form, estadoDireccion: "Completo" })}
                    className="accent-emerald-500"
                  />
                  Completo
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="estadoDireccion"
                    checked={form.estadoDireccion === "Falta dirección"}
                    onChange={() => setForm({ ...form, estadoDireccion: "Falta dirección" })}
                    className="accent-orange-500"
                  />
                  Falta dirección
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Estado obra</Label>
              <Select value={form.estadoObra} onValueChange={(val) => val && setForm({ ...form, estadoObra: val as Obra["estadoObra"] })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activa">Activa</SelectItem>
                  <SelectItem value="Finalizada">Finalizada</SelectItem>
                  <SelectItem value="Suspendida">Suspendida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fuente</Label>
              <Input value={form.fuente} onChange={(e) => setForm({ ...form, fuente: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Alias</Label>
              <Input value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Observaciones</Label>
              <Input value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}

function DataField({ label, value, dot }: { label: string; value: string; dot?: "green" | "orange" }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        {dot && (
          <span className={`size-2 rounded-full ${dot === "green" ? "bg-emerald-500" : "bg-orange-500"}`} />
        )}
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
