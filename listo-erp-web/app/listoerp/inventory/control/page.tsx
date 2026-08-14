"use client";
import { useEffect } from "react";
import { usePageTitle } from "@/lib/page-title-context";
import { InventoryControlList } from "@/packages/inventory/components/inventory-control-list";
export default function InventoryControlRoute() { const { setTitle } = usePageTitle(); useEffect(() => setTitle("Control de inventario"), [setTitle]); return <div className="w-full p-2"><InventoryControlList /></div>; }
