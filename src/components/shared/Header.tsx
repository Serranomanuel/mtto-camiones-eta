"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/use-store";

const routeNames: Record<string, string> = {
  "/inicio": "Inicio",
  "/viajes": "Viajes",
  "/programacion": "Programación",
  "/rutas": "Rutas",
  "/vehiculos": "Vehículos",
  "/conductores": "Conductores",
  "/clientes": "Clientes",
  "/obras": "Obras",
  "/combustible": "Combustible",
  "/peajes": "Peajes",
  "/indicadores": "Indicadores",
  "/dashboard": "Dashboard",
  "/comparativo": "Comparativo",
  "/reportes": "Reportes",
  "/configuracion": "Configuración",
  "/log": "Log de Auditoría",
};

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const name =
      routeNames[currentPath] ||
      (segment.match(/^[\w-]+$/) ? segment.charAt(0).toUpperCase() + segment.slice(1) : segment);
    crumbs.push({ label: name, href: currentPath });
  }

  return crumbs;
}

export function Header() {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { logs } = useAppStore();
  const alertCount = logs.length;

  const breadcrumbs = getBreadcrumbs(pathname);
  const currentPage = routeNames[pathname] || "ETALUM";

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-10 w-10"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>

        <div className="flex-1 flex flex-col">
          <h1 className="text-lg font-semibold">{currentPage}</h1>
          <nav className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <span>ETALUM</span>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <span>/</span>
                <span
                  className={
                    i === breadcrumbs.length - 1
                      ? "text-foreground font-medium"
                      : ""
                  }
                >
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            {alertCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
              >
                {alertCount > 99 ? "99+" : alertCount}
              </Badge>
            )}
          </Button>
          <ThemeToggle />
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
            A
          </div>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
