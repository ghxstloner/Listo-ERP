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
import { useTranslation } from "@/hooks/use-translation";
import { encodeId } from "@/lib/hash-id";
import { useGetBranchesByCompany } from "@/packages/branch/api";
import { useCreateTill } from "@/packages/till/api";
import type { CreateTillRequest } from "@/packages/till/types";
import { Plus } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CODE_LENGTH = 6;
const CODE_REGEX = /^[A-Z0-9]{6}$/;

interface CreateTillProps {
  companyId: number;
}

export function CreateTill({ companyId }: CreateTillProps) {
  const t = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  const [branches, isLoadingBranches, branchError] = useGetBranchesByCompany(companyId);
  const [createTill, isCreating, createError] = useCreateTill();

  useEffect(() => {
    if (branchError) {
      showToast({
        type: "error",
        message: (branchError as Error).message || t("common.error"),
      });
    }
  }, [branchError, t]);

  useEffect(() => {
    if (createError) {
      showToast({
        type: "error",
        message: (createError as Error).message || t("common.error"),
      });
    }
  }, [createError, t]);

  const handleCodeChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
    setCode(upper);
  };

  const handleReset = () => {
    setName("");
    setCode("");
    setBranchId("");
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  const handleCreateTill = () => {
    if (!name.trim()) {
      showToast({
        type: "error",
        message: t("company.tills.validation.nameRequired"),
      });
      return;
    }
    if (!code.trim()) {
      showToast({
        type: "error",
        message: t("company.tills.validation.codeRequired"),
      });
      return;
    }
    if (!CODE_REGEX.test(code)) {
      showToast({
        type: "error",
        message: t("company.tills.validation.codeFormat"),
      });
      return;
    }
    const bid = branchId ? Number(branchId) : undefined;
    if (bid === undefined || Number.isNaN(bid)) {
      showToast({
        type: "error",
        message: t("company.tills.validation.branchRequired"),
      });
      return;
    }

    const request: CreateTillRequest = {
      tillName: name.trim(),
      tillCode: code,
      branchId: bid,
      isActive: true,
    };

    createTill(request, (data) => {
      queryClient.invalidateQueries({ queryKey: ["tills"] });
      handleClose();
      showToast({
        type: "success",
        message: t("company.tills.tillCreated"),
      });
      router.push(`/listoerp/company/tills/${encodeId(data.id)}`);
    });
  };

  const companyBranches = branches?.filter((b) => b.companyId === companyId) ?? branches ?? [];

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="h-4 w-4" />
        {t("company.tills.addNewTill")}
      </Button>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{t("company.tills.addNewTill")}</DialogTitle>
            <DialogDescription>{t("company.tills.addTillDescription")}</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 p-4 py-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="till-name">{t("company.tills.name")}</Label>
                <Input
                  id="till-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("company.tills.name")}
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="till-code">{t("company.tills.code")}</Label>
                <Input
                  id="till-code"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder={t("company.tills.codePlaceholder")}
                  disabled={isCreating}
                  maxLength={CODE_LENGTH}
                  className="font-mono uppercase"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("company.tills.branch")}</Label>
              <Select
                value={branchId}
                onValueChange={setBranchId}
                disabled={isCreating || isLoadingBranches}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("company.tills.selectBranch")} />
                </SelectTrigger>
                <SelectContent>
                  {companyBranches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name} ({b.branchCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-4">
            <Button variant="outline" onClick={handleClose} disabled={isCreating}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreateTill}
              disabled={
                isCreating ||
                !name.trim() ||
                !CODE_REGEX.test(code) ||
                !branchId ||
                isLoadingBranches
              }
            >
              {isCreating ? t("common.saving") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
