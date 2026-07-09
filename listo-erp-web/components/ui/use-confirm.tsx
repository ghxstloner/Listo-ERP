"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Trash2 } from "lucide-react";

export type ConfirmSeverity = "warning" | "destructive" | "info";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  severity?: ConfirmSeverity;
  isLoading?: boolean;
}

const severityConfig = {
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
    iconBg: "bg-yellow-50 dark:bg-yellow-950/20",
    buttonVariant: "default" as const,
  },
  destructive: {
    icon: Trash2,
    iconColor: "text-red-500",
    iconBg: "bg-red-50 dark:bg-red-950/20",
    buttonVariant: "destructive" as const,
  },
  info: {
    icon: AlertCircle,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-950/20",
    buttonVariant: "default" as const,
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  severity = "warning",
  isLoading = false,
}: ConfirmDialogProps) {
  const t = useTranslation();
  const config = severityConfig[severity];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <div
            >
              <Icon className={cn("h-5 w-5", config.iconColor)} />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <DialogFooter className="p-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText || t("common.cancel")}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? t("common.saving") : confirmText || t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
