"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { showToast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/use-translation";
import { getPosDeviceKey } from "@/packages/pos/device-key";
import {
  useCloseCashSession,
  useGetCashSessions,
  useOpenCashSession,
} from "@/packages/cash-sessions/api";
import type { CashSession } from "@/packages/cash-sessions/types";
import { useGetTillPosAccess } from "@/packages/till/api";
import { MagnifyingGlass, Plus, Spinner } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function dateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function statusClass(status: CashSession["status"]) {
  return status === "OPEN"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
    : status === "EXPIRED"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
      : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
}

function OpenCashSessionDialog() {
  const t = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [openingNote, setOpeningNote] = useState("");
  const [till, isLoadingTill] = useGetTillPosAccess();
  const [openCashSession, isOpening, openError] = useOpenCashSession();

  const reset = () => {
    setOpeningAmount("");
    setOpeningNote("");
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const handleOpenSession = () => {
    const amount = Number(openingAmount);

    if (!till) {
      showToast({
        type: "error",
        message: t("sales.cashClosures.validation.tillRequired"),
      });
      return;
    }
    if (Number.isNaN(amount) || amount < 0) {
      showToast({
        type: "error",
        message: t("sales.cashClosures.validation.amountRequired"),
      });
      return;
    }

    openCashSession(
      {
        tillId: till.id,
        deviceKey: getPosDeviceKey(),
        openingAmount: amount,
        openingNote: openingNote.trim() || undefined,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
        close();
        showToast({ type: "success", message: t("sales.cashClosures.opened") });
        router.push("/listoerp/ventas/pos");
      },
    );
  };

  useEffect(() => {
    if (openError) {
      showToast({
        type: "error",
        message: (openError as Error).message || t("common.error"),
      });
    }
  }, [openError, t]);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" disabled={!till || isLoadingTill}>
        <Plus className="h-4 w-4" />
        {t("sales.cashClosures.openCash")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close())}
      >
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("sales.cashClosures.openCash")}</DialogTitle>
            <DialogDescription>
              {t("sales.cashClosures.openDescription")}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 p-4 py-0">
            <div className="rounded-md border p-3 text-sm">
              <p className="text-muted-foreground">{t("sales.cashClosures.till")}</p>
              <p className="font-medium">{till?.tillName} ({till?.tillCode}) - {till?.branch?.name}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opening-amount">
                {t("sales.cashClosures.openingAmount")}
              </Label>
              <Input
                id="opening-amount"
                type="number"
                min="0"
                step="0.01"
                value={openingAmount}
                onChange={(event) => setOpeningAmount(event.target.value)}
                placeholder="0.00"
                disabled={isOpening}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opening-note">
                {t("sales.cashClosures.note")}
              </Label>
              <textarea
                id="opening-note"
                value={openingNote}
                onChange={(event) => setOpeningNote(event.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isOpening}
              />
            </div>
          </div>
          <DialogFooter className="p-4">
            <Button variant="outline" onClick={close} disabled={isOpening}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleOpenSession}
              disabled={isOpening || !till || openingAmount === ""}
            >
              {isOpening
                ? t("common.saving")
                : t("sales.cashClosures.openCash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CloseCashSessionDialog({ session }: { session: CashSession }) {
  const t = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [declaredClosingAmount, setDeclaredClosingAmount] = useState("");
  const [closingNote, setClosingNote] = useState("");
  const [closeCashSession, isClosing, closeError] = useCloseCashSession(
    session.id,
  );

  const handleCloseSession = () => {
    const amount = Number(declaredClosingAmount);
    if (Number.isNaN(amount) || amount < 0) {
      showToast({
        type: "error",
        message: t("sales.cashClosures.validation.amountRequired"),
      });
      return;
    }

    closeCashSession(
      {
        declaredClosingAmount: amount,
        closingNote: closingNote.trim() || undefined,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
        setOpen(false);
        setDeclaredClosingAmount("");
        setClosingNote("");
        showToast({
          type: "success",
          message: t("sales.cashClosures.closedMessage"),
        });
      },
    );
  };

  useEffect(() => {
    if (closeError) {
      showToast({
        type: "error",
        message: (closeError as Error).message || t("common.error"),
      });
    }
  }, [closeError, t]);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t("sales.cashClosures.closeCash")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("sales.cashClosures.closeCash")}</DialogTitle>
            <DialogDescription>
              {session.till.tillName} ({session.till.tillCode})
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 p-4 py-0">
            <div className="rounded-lg border p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("sales.cashClosures.expected")}
                </span>
                <span className="font-medium">
                  {money(session.openingAmount)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="declared-closing-amount">
                {t("sales.cashClosures.declared")}
              </Label>
              <Input
                id="declared-closing-amount"
                type="number"
                min="0"
                step="0.01"
                value={declaredClosingAmount}
                onChange={(event) =>
                  setDeclaredClosingAmount(event.target.value)
                }
                placeholder="0.00"
                disabled={isClosing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing-note">
                {t("sales.cashClosures.note")}
              </Label>
              <textarea
                id="closing-note"
                value={closingNote}
                onChange={(event) => setClosingNote(event.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isClosing}
              />
            </div>
          </div>
          <DialogFooter className="p-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isClosing}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCloseSession}
              disabled={isClosing || declaredClosingAmount === ""}
            >
              {isClosing
                ? t("common.saving")
                : t("sales.cashClosures.closeCash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SessionTable({ sessions }: { sessions: CashSession[] }) {
  const t = useTranslation();

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[180px] items-center justify-center py-10">
          <p className="text-muted-foreground">
            {t("sales.cashClosures.noSessions")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("sales.cashClosures.status")}</TableHead>
            <TableHead>{t("sales.cashClosures.till")}</TableHead>
            <TableHead>{t("sales.cashClosures.branch")}</TableHead>
            <TableHead>{t("sales.cashClosures.openedBy")}</TableHead>
            <TableHead>{t("sales.cashClosures.openedAt")}</TableHead>
            <TableHead>{t("sales.cashClosures.closedAt")}</TableHead>
            <TableHead>{t("sales.cashClosures.openingAmount")}</TableHead>
            <TableHead>{t("sales.cashClosures.declared")}</TableHead>
            <TableHead>{t("sales.cashClosures.difference")}</TableHead>
            <TableHead className="text-right">
              {t("sales.cashClosures.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClass(session.status)}`}
                >
                  {session.status === "OPEN"
                    ? t("sales.cashClosures.open")
                    : session.status === "EXPIRED"
                      ? "Vencida"
                      : t("sales.cashClosures.closed")}
                </span>
              </TableCell>
              <TableCell className="font-medium">
                {session.till.tillName}
                <div className="text-muted-foreground text-xs">
                  {session.till.tillCode}
                </div>
              </TableCell>
              <TableCell>{session.branch.name}</TableCell>
              <TableCell>{session.openedByUser.name}</TableCell>
              <TableCell>{dateTime(session.openedAt)}</TableCell>
              <TableCell>{dateTime(session.closedAt)}</TableCell>
              <TableCell>{money(session.openingAmount)}</TableCell>
              <TableCell>
                {session.declaredClosingAmount
                  ? money(session.declaredClosingAmount)
                  : "-"}
              </TableCell>
              <TableCell>
                {session.differenceAmount
                  ? money(session.differenceAmount)
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                {session.status === "OPEN" || session.status === "EXPIRED" ? (
                  <CloseCashSessionDialog session={session} />
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function CashClosuresList() {
  const t = useTranslation();
  const [sessions, isLoading, error] = useGetCashSessions();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredSessions = useMemo(() => {
    let list = sessions ?? [];
    const q = search.trim().toLowerCase();

    if (statusFilter !== "all") {
      list = list.filter((session) => session.status === statusFilter);
    }

    if (q) {
      list = list.filter((session) => {
        const values = [
          session.till.tillName,
          session.till.tillCode,
          session.branch.name,
          session.branch.branchCode,
          session.openedByUser.name,
          session.openedByUser.email,
          session.closedByUser?.name,
          session.closedByUser?.email,
        ];

        return values.some((value) => value?.toLowerCase().includes(q));
      });
    }

    return list;
  }, [sessions, search, statusFilter]);

  if (isLoading) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">
          {t("common.error")}: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {t("sales.cashClosures.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("sales.cashClosures.description")}
          </p>
        </div>
        <OpenCashSessionDialog />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <MagnifyingGlass
            className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            weight="bold"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("sales.cashClosures.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder={t("sales.cashClosures.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("sales.cashClosures.allStatuses")}
            </SelectItem>
            <SelectItem value="OPEN">{t("sales.cashClosures.open")}</SelectItem>
            <SelectItem value="EXPIRED">Vencidas</SelectItem>
            <SelectItem value="CLOSED">
              {t("sales.cashClosures.closed")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SessionTable sessions={filteredSessions} />
    </div>
  );
}
