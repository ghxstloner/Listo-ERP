import { showToast } from "@/components/ui/sonner";
import { getApiCompanyId, getApiUserInfo } from "@config";
import { useGetCompany } from "@/packages/company/api";
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
import { useGetOrder } from "@/packages/orders/api";
import { useGetTillPosAccess } from "@/packages/till/api";
import type { Seller } from "@/packages/sellers/types";
import { useEffect, useRef, useState } from "react";
import { useCreateSale } from "../api";
import { getPosDeviceKey } from "../device-key";
import type { CartItem, LocalPaymentEntry, PaymentMethod, Sale } from "../types";
import { getTaxRate } from "../utils";

let paymentIdCounter = 0;
function nextPaymentId() {
  paymentIdCounter += 1;
  return `local-${paymentIdCounter}-${Date.now()}`;
}

export function usePointOfSale() {
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [subdepartmentId, setSubdepartmentId] = useState<number | undefined>();
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [subcategoryId, setSubcategoryId] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [payments, setPayments] = useState<LocalPaymentEntry[]>([]);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
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
  const companyId = Number(getApiCompanyId());

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
  const [selectedOrder, selectedOrderLoading] = useGetOrder(selectedOrderId);
  const [inventoryBalances, inventoryLoading] = useGetBranchInventoryBalances(
    selectedOrder?.branchId ?? cashSession?.branchId,
  );
  const [createSale, creatingSale, createSaleError] = useCreateSale();
  const [company, companyLoading] = useGetCompany(companyId);

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
    companyLoading ||
    selectedOrderLoading ||
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

  const selectedCustomer = customer && customers.some((item) => item.id === customer.id)
    ? customer
    : (customers.find((item) => item.id === company?.defaultCustomerId) ?? null);
  const selectedSeller = seller ?? (sellers.find((item) => item.id === company?.defaultSellerId) ?? null);
  const hasOrderSeller = selectedOrder?.seller && seller?.id === selectedOrder.seller.id;

  useEffect(() => {
    if (!selectedOrder) return;
    if (!selectedOrder.seller || !selectedOrder.branch) {
      showToast({ type: "error", message: "El pedido debe tener sucursal y vendedor para poder cobrarse." });
      setSelectedOrderId(null);
      return;
    }
    setCart(selectedOrder.items.map((item) => ({
      product: {
        id: item.productId,
        sku: item.product.sku,
        name: item.product.name,
        salePrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
      } as Product,
      quantity: Number(item.quantity),
    })));
    setCustomer(selectedOrder.customer as Customer);
    setSeller(selectedOrder.seller as Seller);
    setPayments([]);
  }, [selectedOrder]);

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
  const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.round((total - paymentsTotal) * 100) / 100;
  const usedPaymentMethodIds = new Set(payments.map((p) => p.paymentMethodId));
  const availablePaymentMethods = paymentMethods.filter(
    (pm) => !usedPaymentMethodIds.has(pm.id),
  );
  const canOperate = Boolean(
    selectedCustomer &&
    (selectedSeller || hasOrderSeller) &&
    posTill &&
    cashSession?.status === "OPEN" &&
    cashSession.tillId === posTill.id &&
    cashSession.deviceKey === deviceKey,
  );

  const addProduct = (product: Product) => {
    if (!selectedCustomer || (!selectedSeller && !hasOrderSeller)) {
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
        message: "Este producto no tiene inventario disponible en esta sucursal.",
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

  const addPayment = (
    paymentMethod: PaymentMethod,
    amount: number,
  ) => {
    if (usedPaymentMethodIds.has(paymentMethod.id)) {
      showToast({
        type: "error",
        message: "Este método de pago ya fue agregado.",
      });
      return;
    }
    const maxAmount = remaining > 0 ? remaining : 0;
    const clampedAmount = Math.min(amount, maxAmount);
    if (clampedAmount <= 0) {
      showToast({
        type: "warning",
        message: "No hay monto pendiente por pagar.",
      });
      return;
    }
    setPayments((current) => [
      ...current,
      {
        localId: nextPaymentId(),
        paymentMethodId: paymentMethod.id,
        amount: Math.round(clampedAmount * 100) / 100,
      },
    ]);
  };

  const updatePayment = (
    paymentMethodId: number,
    newAmount: number,
  ) => {
    const existingPayment = payments.find(
      (p) => p.paymentMethodId === paymentMethodId,
    );
    if (existingPayment) {
      if (newAmount <= 0) {
        setPayments((current) =>
          current.filter((p) => p.localId !== existingPayment.localId),
        );
      } else {
        const maxAllowed = existingPayment.amount + remaining;
        const clampedAmount = Math.min(newAmount, maxAllowed);
        setPayments((current) =>
          current.map((p) =>
            p.localId === existingPayment.localId
              ? { ...p, amount: Math.round(clampedAmount * 100) / 100 }
              : p,
          ),
        );
      }
    } else if (newAmount > 0 && remaining > 0) {
      const clampedAmount = Math.min(newAmount, remaining);
      setPayments((current) => [
        ...current,
        {
          localId: nextPaymentId(),
          paymentMethodId,
          amount: Math.round(clampedAmount * 100) / 100,
        },
      ]);
    }
  };

  const removePayment = (localId: string) => {
    setPayments((current) => current.filter((p) => p.localId !== localId));
  };

  const charge = () => {
    if (!selectedCustomer || !selectedSeller) {
      showToast({
        type: "error",
        message: "Selecciona cliente y vendedor.",
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
    if (payments.length === 0) {
      showToast({
        type: "error",
        message: "Agrega al menos un método de pago.",
      });
      return;
    }
    if (remaining !== 0) {
      showToast({
        type: "error",
        message:
          remaining > 0
            ? "El monto de los pagos no cubre el total de la venta."
            : "El monto de los pagos excede el total de la venta.",
      });
      return;
    }
    createSale(
      {
        deviceKey: deviceKey!,
        customerId: selectedCustomer.id,
        sellerId: selectedSeller.id,
        orderId: selectedOrderId ?? undefined,
        payments: payments.map(({ paymentMethodId, amount }) => ({
          paymentMethodId,
          amount,
        })),
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      },
      (response) => {
        setCart([]);
        setPayments([]);
        setSelectedOrderId(null);
        setCompletedSale(response.data);
        queryClient.invalidateQueries({
          queryKey: ["inventory", "branches", selectedOrder?.branchId ?? cashSession.branchId, "balances"],
        });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
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
    addPayment,
    updatePayment,
    removePayment,
    canOperate,
    cashSession,
    columns,
    deviceKey,
    cart,
    catalogViewportRef,
    charge,
    currentPage,
    creatingSale,
    completedSale,
    customers,
    categories,
    categoryId,
    departmentId,
    departments,
    loading,
    pageProducts,
    paymentMethods,
    availablePaymentMethods,
    payments,
    paymentsTotal,
    remaining,
    posTill,
    rows,
    search,
    selectedCustomer,
    selectedSeller,
    selectOrder: setSelectedOrderId,
    setCustomer,
    setCategoryId,
    setDepartmentId,
    setPage,
    setCompletedSale,
    setSearch,
    setSeller,
    setSubcategoryId,
    setSubdepartmentId,
    sellers:
      selectedSeller && !sellers.some((item) => item.id === selectedSeller.id)
        ? [...sellers, selectedSeller]
        : sellers,
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
