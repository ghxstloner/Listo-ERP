"use client";

import { usePointOfSale } from "../hooks/use-point-of-sale";
import { CatalogPagination } from "./catalog-pagination";
import { PosToolbar } from "./pos-toolbar";
import { ProductCatalog } from "./product-catalog";
import { Ticket } from "./ticket";

export function PointOfSale() {
  const pos = usePointOfSale();

  return (
    <div className="h-[calc(100dvh-5.5rem)] min-h-[560px]">
      <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="flex min-h-0 min-w-0 flex-col gap-4">
          <PosToolbar
            departmentId={pos.departmentId}
            departments={pos.departments}
            subdepartmentId={pos.subdepartmentId}
            subdepartments={pos.subdepartments}
            categoryId={pos.categoryId}
            categories={pos.categories}
            subcategoryId={pos.subcategoryId}
            subcategories={pos.subcategories}
            search={pos.search}
            onSearchChange={(search) => {
              pos.setSearch(search);
              pos.setPage(1);
            }}
            onDepartmentChange={(departmentId) => {
              pos.setDepartmentId(departmentId);
              pos.setSubdepartmentId(undefined);
              pos.setCategoryId(undefined);
              pos.setSubcategoryId(undefined);
              pos.setPage(1);
            }}
            onSubdepartmentChange={(subdepartmentId) => {
              pos.setSubdepartmentId(subdepartmentId);
              pos.setCategoryId(undefined);
              pos.setSubcategoryId(undefined);
              pos.setPage(1);
            }}
            onCategoryChange={(categoryId) => {
              pos.setCategoryId(categoryId);
              pos.setSubcategoryId(undefined);
              pos.setPage(1);
            }}
            onSubcategoryChange={(subcategoryId) => {
              pos.setSubcategoryId(subcategoryId);
              pos.setPage(1);
            }}
          />
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            {pos.loading ? <div className="text-muted-foreground flex min-h-80 flex-1 items-center justify-center text-sm">Cargando punto de venta...</div> : <>
              <ProductCatalog products={pos.pageProducts} rows={pos.rows} stockByProduct={pos.stockByProduct} disabled={!pos.canOperate} viewportRef={pos.catalogViewportRef} onAdd={pos.addProduct} />
              <CatalogPagination currentPage={pos.currentPage} totalPages={pos.totalPages} onPageChange={pos.setPage} />
            </>}
          </div>
        </main>
        <Ticket
          cart={pos.cart}
          customer={pos.selectedCustomer}
          customers={pos.customers}
          seller={pos.selectedSeller}
          sellers={pos.sellers}
          paymentMethod={pos.selectedPaymentMethod}
          paymentMethods={pos.paymentMethods}
          subtotal={pos.subtotal}
          tax={pos.tax}
          total={pos.total}
          canCharge={pos.canOperate}
          charging={pos.creatingSale}
          stockByProduct={pos.stockByProduct}
          onCustomerChange={(id) => pos.setCustomer(pos.customers.find((item) => item.id === Number(id)) ?? null)}
          onSellerChange={(id) => pos.setSeller(pos.sellers.find((item) => item.id === Number(id)) ?? null)}
          onPaymentMethodChange={(id) => pos.setPaymentMethod(pos.paymentMethods.find((item) => item.id === Number(id)) ?? null)}
          onQuantityChange={pos.updateQuantity}
          onCharge={pos.charge}
        />
      </div>
    </div>
  );
}
