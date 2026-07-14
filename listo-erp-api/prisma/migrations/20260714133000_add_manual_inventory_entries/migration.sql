-- Add manual stock entries and signed inventory adjustments.
ALTER TYPE "InventoryMovementType" ADD VALUE 'MANUAL_ENTRY';
ALTER TYPE "InventoryMovementType" ADD VALUE 'INVENTORY_ADJUSTMENT';
