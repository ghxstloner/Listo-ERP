import { Button } from "@/components/ui/button";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CatalogPagination({ currentPage, totalPages, onPageChange }: CatalogPaginationProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-t pt-3">
      <p className="text-muted-foreground text-sm">Página {currentPage} de {totalPages}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}><CaretLeft weight="bold" /> Anterior</Button>
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Siguiente <CaretRight weight="bold" /></Button>
      </div>
    </div>
  );
}
