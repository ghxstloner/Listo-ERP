"use client";

import { AppSidebar, SidebarNavGroup, SidebarNavItem } from "@/components/app-sidebar";
import { CompanySelector } from "@/components/company-selector";
import { PageLoading } from "@/components/page-loading";
import { useLanguage } from "@/components/providers/language-provider";
import { LanguageToggle } from "@/components/ui/language-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTranslation } from "@/hooks/use-translation";
import { PageTitleProvider, usePageTitle } from "@/lib/page-title-context";
import { useCompanyTheme } from "@/lib/use-company-theme";
import { useSessionPermissions } from "@/packages/auth/api";
import { useGetCompany } from "@/packages/company/api";
import { getApiCompanyId, getApiPermissions, setApiPermissions } from "@config";
import {
  AddressBook,
  ArrowLineUp,
  ArrowsLeftRight,
  Bank,
  BookOpen,
  BookOpenText,
  Buildings,
  ChartBar,
  ChartLine,
  ChartLineUp,
  ChartPie,
  Clipboard,
  ClipboardText,
  CreditCard,
  CurrencyDollar,
  Database,
  FileText,
  Files,
  Gear,
  GearSix,
  HandCoins,
  Hash,
  Lightning,
  Monitor,
  NotePencil,
  Package,
  Receipt,
  SealCheck,
  ShoppingCart,
  ShoppingCartSimple,
  Spinner,
  Storefront,
  Truck,
  UserCircleGear,
  Users,
  Warehouse,
  Wrench,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

function useNavigation(permissions: Set<string>): SidebarNavGroup[] {
  const t = useTranslation();
  const { locale } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigation = useMemo(
    () => [
      {
        items: [
          {
            title: t("navigation.dashboard"),
            icon: ChartLine,
            href: "/listoerp/dashboard",
          },
          {
            title: t("navigation.administration"),
            icon: Gear,
            items: [
              {
                title: t("navigation.generalConfiguration"),
                href: "/listoerp/company",
                icon: GearSix,
              },
              {
                title: t("navigation.branchesConfiguration"),
                href: "/listoerp/company/branches",
                icon: Buildings,
              },
              {
                title: t("navigation.seriesAndNumbering"),
                href: "/listoerp/administracion/series",
                icon: Hash,
              },
              {
                title: t("navigation.currencyManagement"),
                href: "/listoerp/administracion/monedas",
                icon: CurrencyDollar,
              },
              {
                title: t("navigation.cashConfiguration"),
                href: "/listoerp/company/tills",
                icon: HandCoins,
              },
            ],
          },
          {
            title: t("navigation.inventory"),
            icon: Warehouse,
            items: [
              {
                title: t("navigation.masterCatalogs"),
                href: "/listoerp/inventory",
                icon: Database,
              },
              {
                title: t("navigation.products"),
                href: "/listoerp/inventory/products",
                icon: Package,
              },
              {
                title: t("navigation.services"),
                href: "/listoerp/inventory/services",
                icon: Wrench,
              },
              {
                title: t("navigation.inventoryControl"),
                href: "/listoerp/inventory/control",
                icon: ClipboardText,
              },
              {
                title: t("navigation.warehouseTransfers"),
                href: "/listoerp/inventory/warehouse-transfers",
                icon: ArrowsLeftRight,
              },
            ],
          },
          {
            title: t("navigation.purchases"),
            icon: ShoppingCart,
            items: [
              { title: t("navigation.suppliers"), href: "/listoerp/purchases", icon: Truck },
              {
                title: t("navigation.purchaseOrders"),
                href: "/listoerp/purchases/orders",
                icon: ShoppingCartSimple,
              },
              {
                title: t("navigation.supplierBilling"),
                href: "/listoerp/purchases/billing",
                icon: Receipt,
              },
            ],
          },
          {
            title: t("navigation.sales"),
            icon: Storefront,
            items: [
              {
                title: t("navigation.commercialCatalogs"),
                href: "/listoerp/ventas/catalogos",
                icon: AddressBook,
              },
              {
                title: t("navigation.customers"),
                href: "/listoerp/ventas/clientes",
                icon: Users,
              },
              {
                title: t("navigation.sellers"),
                href: "/listoerp/ventas/vendedores",
                icon: UserCircleGear,
              },
              {
                title: t("navigation.cashClosures"),
                href: "/listoerp/ventas/cierres-caja",
                icon: SealCheck,
              },
              {
                title: t("navigation.pointOfSale"),
                href: "/listoerp/ventas/pos",
                icon: Monitor,
              },
              {
                title: t("navigation.electronicInvoices"),
                href: "/listoerp/ventas/facturas-electronicas",
                icon: Files,
              },
              {
                title: t("navigation.orders"),
                href: "/listoerp/ventas/pedidos",
                icon: Clipboard,
              },
              {
                title: t("navigation.quickBilling"),
                href: "/listoerp/ventas/facturacion-rapida",
                icon: Lightning,
              },
              {
                title: t("navigation.creditNotes"),
                href: "/listoerp/ventas/notas-credito",
                icon: NotePencil,
              },
            ],
          },
          {
            title: t("navigation.treasury"),
            icon: Bank,
            items: [
              {
                title: t("navigation.bankAccounts"),
                href: "/listoerp/tesoreria/cuentas-bancarias",
                icon: CreditCard,
              },
              {
                title: t("navigation.customerPayments"),
                href: "/listoerp/tesoreria/cobros",
                icon: HandCoins,
              },
              {
                title: t("navigation.financialMovements"),
                href: "/listoerp/tesoreria/movimientos",
                icon: ArrowLineUp,
              },
            ],
          },
          {
            title: t("navigation.reports"),
            icon: FileText,
            items: [
              {
                title: t("navigation.purchaseBook"),
                href: "/listoerp/reportes/libro-compras",
                icon: BookOpen,
              },
              {
                title: t("navigation.salesBook"),
                href: "/listoerp/reportes/libro-ventas",
                icon: BookOpenText,
              },
              {
                title: t("navigation.salesByArticle"),
                href: "/listoerp/reportes/ventas-articulo",
                icon: ChartBar,
              },
              {
                title: t("navigation.salesByCustomer"),
                href: "/listoerp/reportes/ventas-cliente",
                icon: ChartPie,
              },
              {
                title: t("navigation.purchasesBySupplier"),
                href: "/listoerp/reportes/compras-proveedor",
                icon: ChartLineUp,
              },
            ],
          },
        ],
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [locale, mounted],
  );

  if (!mounted) {
    return [
      {
        items: [],
      },
    ];
  }

  const permissionByPath: Record<string, string> = {
    "/listoerp/dashboard": "dashboard",
    "/listoerp/company": "administration.general",
    "/listoerp/company/branches": "administration.branches",
    "/listoerp/administracion/series": "administration.series",
    "/listoerp/administracion/monedas": "administration.currencies",
    "/listoerp/company/tills": "administration.tills",
    "/listoerp/inventory": "inventory.catalogs",
    "/listoerp/inventory/products": "inventory.products",
    "/listoerp/inventory/services": "inventory.services",
    "/listoerp/inventory/control": "inventory.control",
    "/listoerp/inventory/warehouse-transfers": "inventory.transfers",
    "/listoerp/purchases": "purchases.suppliers",
    "/listoerp/purchases/orders": "purchases.orders",
    "/listoerp/purchases/billing": "purchases.billing",
    "/listoerp/ventas/catalogos": "sales.catalogs",
    "/listoerp/ventas/clientes": "sales.customers",
    "/listoerp/ventas/vendedores": "sales.sellers",
    "/listoerp/ventas/cierres-caja": "sales.cash-closures",
    "/listoerp/ventas/pos": "sales.pos",
    "/listoerp/ventas/facturas-electronicas": "sales.electronic-invoices",
    "/listoerp/ventas/pedidos": "sales.orders",
    "/listoerp/ventas/facturacion-rapida": "sales.quick-billing",
    "/listoerp/ventas/notas-credito": "sales.credit-notes",
    "/listoerp/tesoreria/cuentas-bancarias": "treasury.bank-accounts",
    "/listoerp/tesoreria/cobros": "treasury.customer-payments",
    "/listoerp/tesoreria/movimientos": "treasury.financial-movements",
    "/listoerp/reportes/libro-compras": "reports.purchase-book",
    "/listoerp/reportes/libro-ventas": "reports.sales-book",
    "/listoerp/reportes/ventas-articulo": "reports.sales-by-article",
    "/listoerp/reportes/ventas-cliente": "reports.sales-by-customer",
    "/listoerp/reportes/compras-proveedor": "reports.purchases-by-supplier",
  };

  return navigation.reduce<SidebarNavGroup[]>((groups, group) => {
    const items: SidebarNavItem[] = [];
    group.items.forEach((item) => {
      if (item.href) {
        if (permissions.has(permissionByPath[item.href])) items.push(item);
        return;
      }
      const allowedItems = item.items?.filter((subItem) => permissions.has(permissionByPath[subItem.href])) ?? [];
      if (allowedItems.length > 0) items.push({ ...item, items: allowedItems });
    });
    if (items.length > 0) groups.push({ ...group, items });
    return groups;
  }, []);
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const companyId = getApiCompanyId();
  const [company, isLoading] = useGetCompany(companyId ? Number(companyId) : 0);
  const [session] = useSessionPermissions(companyId);
  const { title } = usePageTitle();
  const [permissions, setPermissions] = useState(() => new Set(getApiPermissions()));
  const navigation = useNavigation(permissions);
  const t = useTranslation();
  const [themeApplied, setThemeApplied] = useState(false);

  useCompanyTheme(
    company
      ? {
          primaryColor: company.primaryColor,
          secondaryColor: company.secondaryColor,
        }
      : null,
  );

  useEffect(() => {
    if (!session) return;
    setApiPermissions(session.permissions);
    setPermissions(new Set(session.permissions));
  }, [session]);

  useEffect(() => {
    if (isLoading || !company) {
      queueMicrotask(() => {
        setThemeApplied(false);
      });

      return;
    }

    const timer = setTimeout(() => {
      setThemeApplied(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [company, isLoading]);

  if (isLoading || !company || !themeApplied) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar
        company={company}
        isLoading={isLoading}
        navigation={navigation}
      />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-t-2 border-primary px-4 bg-card">
          <SidebarTrigger />
          {title && <h1 className="text-lg font-semibold ml-2">{title}</h1>}
          <div className="ml-auto flex items-center gap-2">
            <CompanySelector />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ListoERPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageTitleProvider>
      <LayoutContent>{children}</LayoutContent>
    </PageTitleProvider>
  );
}
