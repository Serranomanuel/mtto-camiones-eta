"use client";

export const dynamic = "force-dynamic";

import { use, useMemo } from "react";
import Link from "next/link";
import { useClientes } from "@/hooks/use-clientes";
import { useObras } from "@/hooks/use-obras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
} from "lucide-react";

export default function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: clientes, loading } = useClientes();
  const { data: obras } = useObras();

  const cliente = useMemo(
    () => clientes.find((c) => c.id === id),
    [clientes, id]
  );

  const obrasCliente = useMemo(
    () => obras.filter((o) => o.clienteId === id),
    [obras, id]
  );

  const stats = useMemo(() => {
    const activas = obrasCliente.filter((o) => o.estadoObra === "Activa").length;
    const finalizadas = obrasCliente.filter((o) => o.estadoObra === "Finalizada").length;
    const suspendidas = obrasCliente.filter((o) => o.estadoObra === "Suspendida").length;
    return {
      total: obrasCliente.length,
      activas,
      finalizadas,
      suspendidas,
    };
  }, [obrasCliente]);

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <SkeletonLoader count={4} />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Link href="/clientes">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{cliente.nombre}</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">NIT: {cliente.nit}</span>
            <StatusBadge status={cliente.estado} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total obras</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activas</p>
              <p className="text-xl font-bold">{stats.activas}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Finalizadas</p>
              <p className="text-xl font-bold">{stats.finalizadas}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" />
              Información de contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contacto</span>
              <span className="font-medium">{cliente.contacto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teléfono</span>
              <span className="font-medium">{cliente.telefono}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{cliente.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ciudad</span>
              <span className="font-medium">{cliente.ciudad}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Detalles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Cliente</span>
              <span className="font-medium">{cliente.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NIT</span>
              <span className="font-medium">{cliente.nit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <StatusBadge status={cliente.estado} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Observaciones</span>
              <span className="font-medium">{cliente.observaciones || "N/A"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Obras asociadas</CardTitle>
        </CardHeader>
        <CardContent>
          {obrasCliente.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-muted-foreground">
              No hay obras registradas para este cliente
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {obrasCliente.map((o) => (
                <Card key={o.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between">
                      <Link
                        href={`/obras/${o.id}`}
                        className="font-medium hover:underline"
                      >
                        {o.nombre}
                      </Link>
                      <StatusBadge status={o.estadoObra} />
                    </div>
                    <p className="text-xs text-muted-foreground">{o.torre}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {o.ciudad}
                      </span>
                      <span>{o.direccion}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
