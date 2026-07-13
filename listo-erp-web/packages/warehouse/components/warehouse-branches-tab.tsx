"use client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetWarehouseBranchesByWarehouse } from "@/packages/warehouse-branch/api";
export function WarehouseBranchesTab({ warehouseId }: { warehouseId: number }) {
  const [branches, loading, error] =
    useGetWarehouseBranchesByWarehouse(warehouseId);
  if (error)
    return (
      <p className="text-destructive">
        No se pudieron cargar las sucursales: {error.message}
      </p>
    );
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sucursal</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Cargando sucursales...
                </TableCell>
              </TableRow>
            ) : !branches?.length ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay sucursales asignadas.
                </TableCell>
              </TableRow>
            ) : (
              branches.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.branch.name}
                  </TableCell>
                  <TableCell>{item.branch.branchCode}</TableCell>
                  <TableCell>
                    {item.branch.isActive ? "Activo" : "Inactivo"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
