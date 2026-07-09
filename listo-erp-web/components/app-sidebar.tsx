"use client";

import { CaretRight, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";
import { AUTH_ROUTES } from "@/packages/auth/constants";
import { getCompanyLogoUrl } from "@/packages/company/api";
import { Company } from "@/packages/company/types";
import { getApiUserInfo, logout } from "@config";
import { DotsThreeCircle } from "@phosphor-icons/react/dist/ssr";

export interface SidebarSubItem {
  title: string;
  href: string;
}

export interface SidebarNavItem {
  title: string;
  icon: PhosphorIcon;
  href?: string;
  items?: SidebarSubItem[];
}
export interface SidebarNavGroup {
  label?: string;
  items: SidebarNavItem[];
}

interface AppSidebarProps {
  company?: Company;
  isLoading?: boolean;
  navigation: SidebarNavGroup[];
}

function CompanyLogo({
  company,
  isLoading,
}: {
  company?: Company;
  isLoading?: boolean;
}) {
  const { state } = useSidebar();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 shrink-0 rounded-md" />
        {state === "expanded" && <Skeleton className="h-4 w-20" />}
      </div>
    );
  }

  const companyName = company?.name || "ListoERP";
  const logoUrl = getCompanyLogoUrl(company?.companyLogo);

  return (
    <div className="flex items-center gap-2 py-[3.6px]">
      <Avatar className="size-8 shrink-0 rounded-md">
        <AvatarImage
          src={logoUrl || undefined}
          alt={companyName}
          className="rounded-md object-contain"
        />
        <AvatarFallback
          name={companyName}
          className="rounded-md bg-sidebar-accent text-xl font-semibold text-sidebar-accent-foreground"
        />
      </Avatar>
      {state === "expanded" && (
        <span className="truncate text-xl font-semibold">{companyName}</span>
      )}
    </div>
  );
}

function NavItem({ item }: { item: SidebarNavItem }) {
  const pathname = usePathname();

  if (item.href && !item.items) {
    const isActive = pathname === item.href;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
          <Link href={item.href}>
            <item.icon weight="fill" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  if (item.items && item.items.length > 0) {
    const isAnyActive = item.items.some((subItem) => pathname === subItem.href);

    return (
      <Collapsible asChild defaultOpen={isAnyActive} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title}>
              <item.icon weight="fill" />
              <span>{item.title}</span>
              <CaretRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" weight="bold" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items.map((subItem) => (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === subItem.href}
                  >
                    <Link href={subItem.href}>
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return null;
}

function NavGroup({ group }: { group: SidebarNavGroup }) {
  return (
    <SidebarGroup>
      {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => (
            <NavItem key={item.title} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function UserFooter() {
  const { state } = useSidebar();
  const router = useRouter();
  const t = useTranslation();
  const [userInfo, setUserInfo] = useState<{ id: number; email: string; name: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsMounted(true);
      const user = getApiUserInfo();
      setUserInfo(user);
    });
  }, []);

  if (!isMounted || !userInfo) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push(AUTH_ROUTES.LOGIN);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex w-full items-center gap-2">
          <SidebarMenuButton
            size="lg"
            className="flex-1 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            tooltip={state === "collapsed" ? `${userInfo.name}\n${userInfo.email}` : undefined}
          >
            <Avatar className="size-8 shrink-0">
              <AvatarImage src="" alt={userInfo.name} />
              <AvatarFallback name={userInfo.name} />
            </Avatar>
            {state === "expanded" && (
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                <span className="truncate text-sm font-medium">{userInfo.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{userInfo.email}</span>
              </div>
            )}
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className="size-8 shrink-0 p-0 justify-center"
                tooltip={t("common.moreOptions")}
              >
                <DotsThreeCircle className="size-4" weight="bold" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="right"
              className="w-48"
            >
              <DropdownMenuItem
                variant="destructive"
                onClick={handleLogout}
              >
                {t("common.exit")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ company, isLoading, navigation }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <CompanyLogo company={company} isLoading={isLoading} />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {navigation.map((group, index) => (
          <NavGroup key={group.label || index} group={group} />
        ))}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <UserFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
