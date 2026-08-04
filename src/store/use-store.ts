import { create } from "zustand";
import type { LogEntry } from "@/types/etalum";
import { logs as mockLogs } from "@/lib/mock-data";

interface AppState {
  logs: LogEntry[];
  sidebarCollapsed: boolean;
  addLog: (log: Omit<LogEntry, "fechaHora">) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  logs: [...mockLogs],
  sidebarCollapsed: false,
  addLog: (log) =>
    set((state) => ({
      logs: [
        { ...log, fechaHora: new Date().toISOString() },
        ...state.logs,
      ],
    })),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
