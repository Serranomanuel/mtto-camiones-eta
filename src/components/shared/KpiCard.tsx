"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  icon?: LucideIcon;
  className?: string;
}

const trendConfig = {
  up: { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  down: { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
  stable: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted" },
};

export function KpiCard({
  title,
  value,
  unit,
  trend = "stable",
  icon: Icon,
  className,
}: KpiCardProps) {
  const trendInfo = trendConfig[trend];
  const TrendIcon = trendInfo.icon;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {title}
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight">
                {typeof value === "number"
                  ? value.toLocaleString("es-CO")
                  : value}
              </span>
              {unit && (
                <span className="text-sm text-muted-foreground">{unit}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {Icon && (
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", trendInfo.bg, trendInfo.color)}>
              <TrendIcon className="h-3 w-3" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
