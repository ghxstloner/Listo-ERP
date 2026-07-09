import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageLoadingProps {
  text: string;
  icon: ReactNode;
  spin?: boolean;
}

export function PageLoading({ text, icon, spin = false }: PageLoadingProps) {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-4">
      <div
        className={cn(
          "text-muted-foreground",
          spin && "animate-spin"
        )}
      >
        {icon}
      </div>
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}
