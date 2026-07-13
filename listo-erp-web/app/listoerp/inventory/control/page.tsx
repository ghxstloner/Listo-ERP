"use client";
import { useEffect } from "react";
import { usePageTitle } from "@/lib/page-title-context";
import { InventoryControlPage } from "@/packages/inventory/components/inventory-control-page";
export default function InventoryControlRoute() { const { setTitle } = usePageTitle(); useEffect(() => setTitle("Control de inventario"), [setTitle]); return <div className="w-full p-2"><InventoryControlPage /></div>; }
