"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-store";
import { Button } from "@/components/ui/button";
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
  ChevronLeft,
  ChevronRight,
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

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b">
        {!sidebarCollapsed && (
          <span
            className="text-lg font-bold text-sidebar-primary tracking-tight"
            style={{ fontFamily: "var(--font-brand)" }}
          >
            ETALUM <span className="text-sidebar-primary/60 font-medium">ZFS</span>
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-sidebar-primary/10 text-sidebar-primary border-r-2 border-sidebar-primary",
                !isActive && "text-sidebar-foreground/70"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
