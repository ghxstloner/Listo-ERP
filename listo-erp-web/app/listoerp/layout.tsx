"use client";

import { AppSidebar, SidebarNavGroup } from "@/components/app-sidebar";
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
import { useGetCompany } from "@/packages/company/api";
import { getApiCompanyId } from "@config";
import {
  Bank,
  ChartLine,
  FileText,
  Gear,
  ShoppingCart,
  Spinner,
  Storefront,
  Warehouse,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

function useNavigation(): SidebarNavGroup[] {
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
              },
              {
                title: t("navigation.branchesConfiguration"),
                href: "/listoerp/company/branches",
              },
              {
                title: t("navigation.seriesAndNumbering"),
                href: "/listoerp/administracion/series",
              },
              {
                title: t("navigation.currencyManagement"),
                href: "/listoerp/administracion/monedas",
              },
              {
                title: t("navigation.cashConfiguration"),
                href: "/listoerp/company/tills",
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
              },
              {
                title: t("navigation.products"),
                href: "/listoerp/inventory/products",
              },
              {
                title: t("navigation.services"),
                href: "/listoerp/inventory/services",
              },
              {
                title: t("navigation.inventoryControl"),
                href: "/listoerp/inventory/control",
              },
              {
                title: t("navigation.warehouseTransfers"),
                href: "/listoerp/inventory/warehouse-transfers",
              },
            ],
          },
          {
            title: t("navigation.purchases"),
            icon: ShoppingCart,
            items: [
              { title: t("navigation.suppliers"), href: "/listoerp/purchases" },
              {
                title: t("navigation.purchaseOrders"),
                href: "/listoerp/compras/ordenes",
              },
              {
                title: t("navigation.supplierBilling"),
                href: "/listoerp/compras/facturacion",
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
              },
              {
                title: t("navigation.customers"),
                href: "/listoerp/ventas/clientes",
              },
              {
                title: t("navigation.sellers"),
                href: "/listoerp/ventas/vendedores",
              },
              {
                title: t("navigation.cashClosures"),
                href: "/listoerp/ventas/cierres-caja",
              },
              {
                title: t("navigation.pointOfSale"),
                href: "/listoerp/ventas/pos",
              },
              {
                title: t("navigation.orders"),
                href: "/listoerp/ventas/pedidos",
              },
              {
                title: t("navigation.quickBilling"),
                href: "/listoerp/ventas/facturacion-rapida",
              },
              {
                title: t("navigation.creditNotes"),
                href: "/listoerp/ventas/notas-credito",
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
              },
              {
                title: t("navigation.customerPayments"),
                href: "/listoerp/tesoreria/cobros",
              },
              {
                title: t("navigation.financialMovements"),
                href: "/listoerp/tesoreria/movimientos",
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
              },
              {
                title: t("navigation.salesBook"),
                href: "/listoerp/reportes/libro-ventas",
              },
              {
                title: t("navigation.salesByArticle"),
                href: "/listoerp/reportes/ventas-articulo",
              },
              {
                title: t("navigation.salesByCustomer"),
                href: "/listoerp/reportes/ventas-cliente",
              },
              {
                title: t("navigation.purchasesBySupplier"),
                href: "/listoerp/reportes/compras-proveedor",
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

  return navigation;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const companyId = getApiCompanyId();
  const [company, isLoading] = useGetCompany(companyId ? Number(companyId) : 0);
  const { title } = usePageTitle();
  const navigation = useNavigation();
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
        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-card">
          <SidebarTrigger />
          {title && <h1 className="text-lg font-semibold ml-2">{title}</h1>}
          <div className="ml-auto flex items-center gap-2">
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
