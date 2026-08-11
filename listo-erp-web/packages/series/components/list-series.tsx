"use client";

import { Card, CardContent } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { ConfirmDialog } from "@/components/ui/use-confirm";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDeleteSeries } from "../api";
import type { Series } from "../types";
import { SeriesTable } from "./series-table";

interface ListSeriesProps {
  series: Series[];
  onEdit: (series: Series) => void;
  headerAction?: React.ReactNode;
}

export function ListSeries({
  series,
  onEdit,
  headerAction,
}: ListSeriesProps) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [deletingSeriesId, setDeletingSeriesId] = useState<number | null>(null);
  const [seriesToDelete, setSeriesToDelete] = useState<Series | null>(null);
  const [deleteSeries, isDeleting, deleteError] = useDeleteSeries(
    deletingSeriesId || 0
  );

  useEffect(() => {
    if (deleteError) {
      showToast({
        type: "error",
        message:
          (deleteError as Error).message || t("common.error"),
      });
    }
  }, [deleteError, t]);

  const handleDeleteClick = (series: Series) => {
    setSeriesToDelete(series);
  };

  const handleConfirmDelete = () => {
    if (!seriesToDelete || isDeleting) return;

    setDeletingSeriesId(seriesToDelete.id);
    deleteSeries(undefined, () => {
      queryClient.invalidateQueries({
        queryKey: ["series"],
      });
      setDeletingSeriesId(null);
      setSeriesToDelete(null);
      showToast({
        type: "success",
        message: t("administration.series.seriesDeleted"),
      });
    });
  };

  return (
    <Card className="w-full">
      <CardContent>
        <SeriesTable
          series={series ?? []}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
          isDeleting={isDeleting}
          deletingSeriesId={deletingSeriesId}
          t={t}
          action={headerAction}
        />
      </CardContent>
      <ConfirmDialog
        open={!!seriesToDelete}
        onOpenChange={(open) => !open && setSeriesToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("administration.series.confirmDelete")}
        description={t("administration.series.confirmDeleteMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        severity="destructive"
        isLoading={isDeleting && deletingSeriesId === seriesToDelete?.id}
      />
    </Card>
  );
}
