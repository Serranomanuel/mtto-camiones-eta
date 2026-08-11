"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useState } from "react";

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit?: () => void | Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
}

export function FormModal({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "Guardar",
  disabled = false,
}: FormModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit() {
    if (!onSubmit || saving) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await onSubmit();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar el registro");
    } finally {
      setSaving(false);
    }
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">{children}</div>
          {onSubmit && (
            <div className="flex justify-end gap-2">
              {submitError && <p className="mr-auto self-center text-sm text-destructive">{submitError}</p>}
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={submit} disabled={disabled || saving}>{saving ? "Guardando..." : submitLabel}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="pb-4">{children}</div>
        {onSubmit && (
          <div className="flex justify-end gap-2 pb-4">
            {submitError && <p className="mr-auto self-center text-sm text-destructive">{submitError}</p>}
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={disabled || saving}>{saving ? "Guardando..." : submitLabel}</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
