"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ColorOption {
  name: string;
  hex: string;
}

const COLORS: ColorOption[] = [
  { name: "Azul", hex: "#3B82F6" },
  { name: "Verde", hex: "#10B981" },
  { name: "Rojo", hex: "#EF4444" },
  { name: "Amarillo", hex: "#F59E0B" },
  { name: "Púrpura", hex: "#8B5CF6" },
  { name: "Rosa", hex: "#EC4899" },
  { name: "Cian", hex: "#06B6D4" },
  { name: "Naranja", hex: "#F97316" },
  { name: "Índigo", hex: "#6366F1" },
  { name: "Esmeralda", hex: "#14B8A6" },
  { name: "Azul Oscuro", hex: "#1E40AF" },
  { name: "Verde Oscuro", hex: "#047857" },
  { name: "Rojo Oscuro", hex: "#B91C1C" },
  { name: "Púrpura Oscuro", hex: "#6D28D9" },
  { name: "Gris", hex: "#6B7280" },
  { name: "Negro", hex: "#000000" },
];

interface ColorSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

export function ColorSelect({
  value,
  onValueChange,
  placeholder = "Seleccionar color",
}: ColorSelectProps) {
  const selectedColor = COLORS.find((color) => color.hex === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedColor && (
            <div
              className="size-4 rounded-full border border-border shrink-0"
              style={{ backgroundColor: selectedColor.hex }}
            />
          )}
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[100px]">
        {COLORS.map((color) => (
          <SelectItem key={color.hex} value={color.hex} textValue={color.name}>
            <div className="flex items-center gap-2">
              <div
                className="size-4 rounded-full border border-border shrink-0"
                style={{ backgroundColor: color.hex }}
              />
              <span>{color.name}</span>
              <span className="text-muted-foreground ml-auto text-xs">
                {color.hex}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
