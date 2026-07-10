"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";
import type { CompanyUserWithUser } from "@/packages/company-user/types";
import { CaretDown, UserCircle } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

interface UserAssignmentListProps {
  companyUsers: CompanyUserWithUser[];
  selectedUserIds: number[];
  onChange: (userIds: number[]) => void;
  disabled?: boolean;
}

export function UserAssignmentList({
  companyUsers,
  selectedUserIds,
  onChange,
  disabled,
}: UserAssignmentListProps) {
  const t = useTranslation();
  const [search, setSearch] = useState("");
  const selected = new Set(selectedUserIds);

  const selectedLabel =
    selectedUserIds.length === 0
      ? t("sales.sellers.selectUsers")
      : `${selectedUserIds.length} ${
          selectedUserIds.length === 1
            ? t("sales.sellers.userSelected")
            : t("sales.sellers.usersSelected")
        }`;

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companyUsers.filter(({ user }) => {
      if (!user.isActive) return false;
      if (!q) return true;
      return [user.name, user.email].some((value) =>
        value.toLowerCase().includes(q),
      );
    });
  }, [companyUsers, search]);

  const toggleUser = (userId: number) => {
    if (disabled) return;
    if (selected.has(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
      return;
    }
    onChange([...selectedUserIds, userId]);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className="truncate">{selectedLabel}</span>
          <CaretDown className="h-4 w-4 opacity-50" weight="bold" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => event.stopPropagation()}
          placeholder={t("sales.sellers.searchUsers")}
          className="mb-2"
          disabled={disabled}
        />
        <div className="max-h-64 overflow-y-auto">
          {filteredUsers.length ? (
            filteredUsers.map(({ user }) => (
              <DropdownMenuCheckboxItem
                key={user.id}
                checked={selected.has(user.id)}
                disabled={disabled}
                onCheckedChange={() => toggleUser(user.id)}
                onSelect={(event) => event.preventDefault()}
                className="items-start gap-3 py-2"
              >
                <UserCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </span>
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t("sales.sellers.noUsers")}
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            {t("sales.sellers.selectedUsers")}: {selectedUserIds.length}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            disabled={disabled || selectedUserIds.length === 0}
            onClick={() => onChange([])}
          >
            {t("sales.sellers.clearUsers")}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
