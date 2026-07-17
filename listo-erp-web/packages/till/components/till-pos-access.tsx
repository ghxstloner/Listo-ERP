"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { showToast } from "@/components/ui/sonner";
import { useAssociateTillPosAccess } from "@/packages/till/api";
import type { Till } from "@/packages/till/types";
import { queryClient } from "@/packages/config/query/client";
import { useEffect, useState } from "react";

export function TillPosAccess({ till }: { till: Till }) {
  const [associate, associating, error] = useAssociateTillPosAccess(till.id);
  const [associationType, setAssociationType] = useState(till.posAssociationType);

  useEffect(() => {
    if (error) showToast({ type: "error", message: error.message });
  }, [error]);

  const createAssociation = (type: "IP" | "USER_SESSION") =>
    associate({ type }, (response) => {
      setAssociationType(response.data.posAssociationType);
      queryClient.invalidateQueries({ queryKey: ["tills", till.id] });
      queryClient.invalidateQueries({ queryKey: ["tills"] });
      showToast({
        type: "success",
        message: "Caja asociada al acceso POS actual.",
      });
    });

  const status = associationType === "IP"
    ? "Asociada a esta IP"
    : associationType === "USER_SESSION"
      ? "Asociada a la sesión actual"
      : "Sin asociación POS";

  return (
    <Card>
      <CardHeader>
        <p className="font-semibold">Acceso POS</p>
        <p className="text-muted-foreground text-sm">
          Asociar una opción invalida cualquier asociación anterior de esta
          caja.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`rounded-md border px-3 py-2 text-sm ${associationType ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "text-muted-foreground"}`}>
          {status}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => createAssociation("IP")}
            disabled={associating}
          >
            Asociar a esta IP
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => createAssociation("USER_SESSION")}
            disabled={associating}
          >
            Asociar a mi sesión
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
