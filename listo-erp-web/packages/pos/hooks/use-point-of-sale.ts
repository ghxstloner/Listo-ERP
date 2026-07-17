import { showToast } from "@/components/ui/sonner";
import { getApiUserInfo } from "@config";
import { useGetCustomers } from "@/packages/customers/api";
import type { Customer } from "@/packages/customers/types";
import { useGetDepartments } from "@/packages/department/api";
import { useGetCategories } from "@/packages/category/api";
import { useGetBranchInventoryBalances } from "@/packages/inventory/api";
import { useGetCurrentCashSession } from "@/packages/cash-sessions/api";
import { queryClient } from "@/packages/config/query/client";
import { useGetProducts } from "@/packages/product/api";
import { useGetSubCategories } from "@/packages/subcategory/api";
import { useGetSubDepartments } from "@/packages/subdepartment/api";
import type { Product } from "@/packages/product/types";
import { useGetSellers } from "@/packages/sellers/api";
import { useGetTillPosAccess } from "@/packages/till/api";
import type { Seller } from "@/packages/sellers/types";
import { useEffect, useRef, useState } from "react";
import { useCreateSale } from "../api";
import { getPosDeviceKey } from "../device-key";
import type { CartItem, PaymentMethod } from "../types";
import { getTaxRate } from "../utils";

export function usePointOfSale() {
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [subdepartmentId, setSubdepartmentId] = useState<number | undefined>();
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [subcategoryId, setSubcategoryId] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [catalogSize, setCatalogSize] = useState({ width: 0, height: 0 });
  const [deviceKey] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return getPosDeviceKey();
  });
  const catalogViewportRef = useRef<HTMLDivElement>(null);
  const noCustomerToastShown = useRef(false);
  const noSellerToastShown = useRef(false);
  const loggedUser = getApiUserInfo();

  const [productsResponse, productsLoading] = useGetProducts({
    departmentId,
    subdepartmentId,
    categoryId,
    subcategoryId,
  });
  const [departmentsResponse, departmentsLoading] = useGetDepartments();
  const [subdepartmentsResponse] = useGetSubDepartments(departmentId);
  const [categoriesResponse] = useGetCategories(subdepartmentId);
  const [subcategoriesResponse] = useGetSubCategories(categoryId);
  const [customersResponse, customersLoading] = useGetCustomers();
  const [sellersResponse, sellersLoading] = useGetSellers();
  const [cashSession, cashSessionLoading] = useGetCurrentCashSession();
  const [posTill, posTillLoading] = useGetTillPosAccess();
  const [inventoryBalances, inventoryLoading] = useGetBranchInventoryBalances(
    cashSession?.branchId,
  );
  const [createSale, creatingSale, createSaleError] = useCreateSale();

  const products = (
    Array.isArray(productsResponse)
      ? productsResponse
      : (productsResponse?.data ?? [])
  ).filter((product) => product.isActive);
  const departments = (departmentsResponse?.data ?? []).filter(
    (department) => department.isActive,
  );
  const subdepartments = (subdepartmentsResponse?.data ?? []).filter(
    (subdepartment) => subdepartment.isActive,
  );
  const categories = (categoriesResponse?.data ?? []).filter(
    (category) => category.isActive,
  );
  const subcategories = (subcategoriesResponse?.data ?? []).filter(
    (subcategory) => subcategory.isActive,
  );
  const customers = (customersResponse ?? []).filter((item) => item.isActive);
  const sellers = (sellersResponse ?? []).filter(
    (item) =>
      item.isActive &&
      item.sellerUsers.some(
        (assignment) =>
          assignment.userId === loggedUser?.id && assignment.user.isActive,
      ),
  );
  const paymentMethods = (posTill?.paymentMethods ?? [])
    .map(({ paymentMethod }) => paymentMethod)
    .filter((item) => item.isActive);
  const stockByProduct = new Map<number, number>();
  for (const balance of inventoryBalances ?? []) {
    stockByProduct.set(
      balance.product.id,
      (stockByProduct.get(balance.product.id) ?? 0) +
        Math.max(0, Number(balance.quantity)),
    );
  }
  const loading =
    productsLoading ||
    departmentsLoading ||
    customersLoading ||
    sellersLoading ||
    cashSessionLoading ||
    posTillLoading ||
    inventoryLoading ||
    !deviceKey;

  useEffect(() => {
    if (customersLoading) return;
    if (customers.length === 0 && !noCustomerToastShown.current) {
      noCustomerToastShown.current = true;
      showToast({
        type: "error",
        message: "No hay clientes activos para realizar una venta.",
      });
    }
  }, [customers.length, customersLoading]);

  useEffect(() => {
    if (sellersLoading) return;
    if (sellers.length === 0 && !noSellerToastShown.current) {
      noSellerToastShown.current = true;
      showToast({
        type: "error",
        message: "No tienes un vendedor activo asignado.",
      });
    }
  }, [sellers.length, sellersLoading]);

  const selectedCustomer =
    customer && customers.some((item) => item.id === customer.id)
      ? customer
      : (customers[0] ?? null);
  const selectedSeller =
    seller && sellers.some((item) => item.id === seller.id)
      ? seller
      : (sellers[0] ?? null);
  const selectedPaymentMethod =
    paymentMethod && paymentMethods.some((item) => item.id === paymentMethod.id)
      ? paymentMethod
      : (paymentMethods[0] ?? null);

  useEffect(() => {
    if (loading) return;
    const element = catalogViewportRef.current;
    if (!element) return;

    const updateSize = () =>
      setCatalogSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    updateSize();
    return () => observer.disconnect();
  }, [loading]);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredProducts = products.filter(
    (product) =>
      !normalizedSearch ||
      product.name.toLocaleLowerCase().includes(normalizedSearch) ||
      product.sku.toLocaleLowerCase().includes(normalizedSearch),
  );
  const columns =
    catalogSize.width >= 1280
      ? 4
      : catalogSize.width >= 768
        ? 3
        : catalogSize.width >= 640
          ? 2
          : 1;
  const rows = Math.max(1, Math.floor((catalogSize.height + 12) / 232));
  const productsPerPage = columns * rows;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / productsPerPage),
  );
  const currentPage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
  );
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.salePrice * item.quantity,
    0,
  );
  const tax = cart.reduce(
    (sum, item) =>
      sum + item.product.salePrice * item.quantity * getTaxRate(item.product),
    0,
  );
  const total = subtotal + tax;
  const canOperate = Boolean(
    selectedCustomer &&
    selectedSeller &&
    posTill &&
    cashSession?.status === "OPEN" &&
    cashSession.tillId === posTill.id &&
    cashSession.deviceKey === deviceKey,
  );

  const addProduct = (product: Product) => {
    if (!selectedCustomer || !selectedSeller) {
      showToast({
        type: "error",
        message: !selectedCustomer
          ? "No hay clientes activos para realizar una venta."
          : "No tienes un vendedor activo asignado.",
      });
      return;
    }
    const availableStock = stockByProduct.get(product.id) ?? 0;
    if (availableStock <= 0) {
      showToast({
        type: "warning",
        message: "Este producto no tiene inventario disponible.",
      });
      return;
    }
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem && existingItem.quantity >= availableStock) {
      showToast({
        type: "warning",
        message: "Ya alcanzaste el inventario disponible para este producto.",
      });
      return;
    }
    setCart((current) => {
      const item = current.find((line) => line.product.id === product.id);
      if (!item) return [...current, { product, quantity: 1 }];
      return current.map((line) =>
        line.product.id === product.id
          ? { ...line, quantity: line.quantity + 1 }
          : line,
      );
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (!Number.isFinite(quantity)) return;
    if (quantity <= 0) {
      setCart((current) =>
        current.filter((item) => item.product.id !== productId),
      );
      return;
    }
    const availableStock = stockByProduct.get(productId) ?? 0;
    const nextQuantity = Math.min(quantity, availableStock);
    if (quantity > availableStock) {
      showToast({
        type: "warning",
        message: `La cantidad se ajustó al máximo disponible: ${availableStock}.`,
      });
    }
    setCart((current) =>
      nextQuantity <= 0
        ? current.filter((item) => item.product.id !== productId)
        : current.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: nextQuantity }
              : item,
          ),
    );
  };

  const charge = () => {
    if (!selectedCustomer || !selectedSeller || !selectedPaymentMethod) {
      showToast({
        type: "error",
        message: "Selecciona cliente, vendedor y método de pago.",
      });
      return;
    }
    if (cart.length === 0) {
      showToast({
        type: "error",
        message: "Agrega al menos un producto al ticket.",
      });
      return;
    }
    if (!cashSession) {
      showToast({
        type: "error",
        message: "Debes tener una caja abierta para registrar una venta.",
      });
      return;
    }
    createSale(
      {
        deviceKey: deviceKey!,
        customerId: selectedCustomer.id,
        sellerId: selectedSeller.id,
        paymentMethodId: selectedPaymentMethod.id,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      },
      () => {
        setCart([]);
        queryClient.invalidateQueries({
          queryKey: ["inventory", "branches", cashSession.branchId, "balances"],
        });
        showToast({
          type: "success",
          message: "Venta registrada correctamente.",
        });
      },
    );
  };

  useEffect(() => {
    if (createSaleError) {
      showToast({ type: "error", message: createSaleError.message });
    }
  }, [createSaleError]);

  return {
    addProduct,
    canOperate,
    cashSession,
    deviceKey,
    cart,
    catalogViewportRef,
    charge,
    currentPage,
    creatingSale,
    customers,
    categories,
    categoryId,
    departmentId,
    departments,
    loading,
    pageProducts,
    paymentMethods,
    posTill,
    rows,
    search,
    selectedCustomer,
    selectedPaymentMethod,
    selectedSeller,
    setCustomer,
    setCategoryId,
    setDepartmentId,
    setPage,
    setPaymentMethod,
    setSearch,
    setSeller,
    setSubcategoryId,
    setSubdepartmentId,
    sellers,
    stockByProduct,
    subcategories,
    subcategoryId,
    subdepartments,
    subdepartmentId,
    subtotal,
    tax,
    total,
    totalPages,
    updateQuantity,
  };
}
