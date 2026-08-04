"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Truck,
  CalendarDays,
  MapPin,
  Bus,
  User,
  Building2,
  HardHat,
  Fuel,
  Route,
  BarChart3,
  PieChart,
  GitCompareArrows,
  FileText,
  Settings,
  ScrollText,
} from "lucide-react";

const menuItems = [
  { href: "/inicio", label: "INICIO", icon: LayoutDashboard },
  { href: "/viajes", label: "VIAJES", icon: Truck },
  { href: "/programacion", label: "PROGRAMACIÓN", icon: CalendarDays },
  { href: "/rutas", label: "RUTAS", icon: MapPin },
  { href: "/vehiculos", label: "VEHÍCULOS", icon: Bus },
  { href: "/conductores", label: "CONDUCTORES", icon: User },
  { href: "/clientes", label: "CLIENTES", icon: Building2 },
  { href: "/obras", label: "OBRAS", icon: HardHat },
  { href: "/combustible", label: "COMBUSTIBLE", icon: Fuel },
  { href: "/peajes", label: "PEAJES", icon: Route },
  { href: "/indicadores", label: "INDICADORES", icon: BarChart3 },
  { href: "/dashboard", label: "DASHBOARD", icon: PieChart },
  { href: "/comparativo", label: "COMPARATIVO", icon: GitCompareArrows },
  { href: "/reportes", label: "REPORTES", icon: FileText },
  { href: "/configuracion", label: "CONFIGURACIÓN", icon: Settings },
  { href: "/log", label: "LOG", icon: ScrollText },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-lg font-bold text-primary">
            ETALUM
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                  "hover:bg-accent/50",
                  isActive
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
