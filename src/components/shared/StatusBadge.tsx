"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant = "default" | "success" | "warning" | "destructive" | "info" | "purple";

const statusColorMap: Record<string, StatusVariant> = {
  // Vehículos y conductores
  "Activo": "success",
  "Activa": "success",
  "Completado": "success",
  "Entregado": "success",
  // Programación y viajes
  "Programado": "info",
  "En preparación": "info",
  "Despachado": "info",
  // Estados intermedios
  "En ruta": "warning",
  "En taller": "warning",
  "Vacaciones": "warning",
  "Pendiente": "warning",
  "Incapacidad": "warning",
  // Estados negativos
  "Cancelado": "destructive",
  "Inactivo": "destructive",
  "Inactiva": "destructive",
  "No cumplido": "destructive",
  "Falta dirección": "warning",
  // Otros
  "Finalizada": "default",
  "Suspendida": "destructive",
  "Cumplido": "success",
  // Log acciones
  "Crear": "success",
  "Editar": "info",
  "Eliminar": "destructive",
  "Importar": "warning",
  "Generar": "purple",
  // Roles
  "Admin": "destructive",
  "Editor": "info",
  "Visual": "default",
};

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-secondary/10 text-secondary border-secondary/20",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  destructive: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  purple: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusColorMap[status] || "default";

  return (
    <Badge
      variant="outline"
      className={cn(variantStyles[variant], "font-medium", className)}
    >
      {status}
    </Badge>
  );
}
