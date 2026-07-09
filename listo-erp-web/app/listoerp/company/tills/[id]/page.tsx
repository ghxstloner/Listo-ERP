"use client";

import { PageLoading } from "@/components/page-loading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import { decodeId } from "@/lib/hash-id";
import { useGetTill } from "@/packages/till/api";
import { TillConfigForm } from "@/packages/till/components/till-config-form";
import { ArrowLeft, Spinner } from "@phosphor-icons/react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function TillConfigPage() {
  const t = useTranslation();
  const params = useParams();
  const hash = params.id as string;
  const tillId = hash ? decodeId(hash) : null;

  const [till, isLoading, error] = useGetTill(tillId ?? 0);

  if (hash === undefined || tillId === null) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t("company.tills.tillNotFound")}</p>
        <Button variant="outline" asChild>
          <Link href="/listoerp/company/tills">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("company.tills.title")}
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <PageLoading
        text={t("common.loading")}
        icon={<Spinner size={32} />}
        spin={true}
      />
    );
  }

  if (error || !till) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-destructive">
          {t("common.error")}: {(error as Error)?.message ?? t("company.tills.tillNotFound")}
        </p>
        <Button variant="outline" asChild>
          <Link href="/listoerp/company/tills">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("company.tills.title")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <Tabs defaultValue="general" className="w-full">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/listoerp/company/tills" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("company.tills.title")}
            </Link>
          </Button>
          <TabsList>
            <TabsTrigger value="general">{t("company.generalConfiguration")}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="general" className="mt-2 w-full">
          <TillConfigForm key={till.id} till={till} tillId={tillId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
