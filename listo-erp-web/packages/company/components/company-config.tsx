"use client";

import { ColorSelect } from "@/components/color-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";
import { Camera, Spinner } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { useGetCountries } from "../../country/api";
import { getCompanyLogoUrl, useUploadCompanyLogo } from "../api";
import { Company } from "../types";

interface CompanyConfigProps {
  company: Company;
  onUpdate?: (data: Partial<Company>) => void;
  onLogoUploaded?: () => void;
  isUpdating?: boolean;
}

export function CompanyConfig({ company, onUpdate, onLogoUploaded, isUpdating }: CompanyConfigProps) {
  const t = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [countries, isLoadingCountries] = useGetCountries();
  const [name, setName] = useState(company.name);
  const [primaryColor, setPrimaryColor] = useState(company.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(company.secondaryColor);
  const [address, setAddress] = useState(company.address || "");
  const [city, setCity] = useState(company.city || "");
  const [phone1, setPhone1] = useState(company.phone1 || "");
  const [phone2, setPhone2] = useState(company.phone2 || "");
  const [email1, setEmail1] = useState(company.email1 || "");
  const [email2, setEmail2] = useState(company.email2 || "");
  const [countryId, setCountryId] = useState<number | null>(company.countryId || null);
  const [taxDocumentType, setTaxDocumentType] = useState(company.taxDocumentType || "");
  const [taxDocumentNumber, setTaxDocumentNumber] = useState(company.taxDocumentNumber || "");
  const [taxCheckDigit, setTaxCheckDigit] = useState(company.taxCheckDigit || "");
  const [fiscalName, setFiscalName] = useState(company.fiscalName || "");
  const [uploadLogo, isUploadingLogo] = useUploadCompanyLogo(company.id);
  const selectedCountry = countries?.find((c) => c.id === countryId);

  const handleCountryChange = (value: string) => {
    const newCountryId = value ? Number(value) : null;
    setCountryId(newCountryId);
    // Auto-seleccionar el único tipo de documento del país
    const country = countries?.find((c) => c.id === newCountryId);
    if (country && country.taxDocumentTypes.length > 0) {
      setTaxDocumentType(country.taxDocumentTypes[0].code);
    } else {
      setTaxDocumentType("");
    }
    setTaxDocumentNumber("");
    setTaxCheckDigit("");
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      uploadLogo(file, () => {
        onLogoUploaded?.();
      });
    }
    e.target.value = "";
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        name,
        primaryColor,
        secondaryColor,
        address,
        city,
        phone1,
        phone2,
        email1,
        email2,
        countryId: countryId || undefined,
        taxDocumentType,
        taxDocumentNumber,
        taxCheckDigit,
        fiscalName,
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("company.generalConfiguration")}</CardTitle>
      </CardHeader>
      <CardContent className="w-full">
        <div className="flex gap-8 items-start">
          <div className="shrink-0">
            <div className="space-y-2">
              <Label>{t("company.companyLogo")}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleImageClick}
                disabled={isUploadingLogo}
                className="relative group"
              >
                <Avatar className="size-32 cursor-pointer ring-2 ring-offset-2 ring-offset-background ring-primary/20 group-hover:ring-primary/40 transition-all">
                  <AvatarImage
                    src={getCompanyLogoUrl(company.companyLogo) || undefined}
                    alt={company.name}
                  />
                  <AvatarFallback name={company.name} className="text-2xl" />
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                  {isUploadingLogo ? (
                    <Spinner className="size-8 text-white" weight="bold" />
                  ) : (
                    <Camera className="size-8 text-white" weight="bold" />
                  )}
                </div>
              </button>
              <p className="text-sm text-muted-foreground max-w-[128px]">
                {t("company.clickToChangeLogo")}
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-6">
            {/* Sección de información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">{t("company.companyName")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("company.companyNamePlaceholder")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fiscalName">{t("company.fiscalName")}</Label>
                <Input
                  id="fiscalName"
                  value={fiscalName}
                  onChange={(e) => setFiscalName(e.target.value)}
                  placeholder={t("company.fiscalNamePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryColor">{t("company.primaryColor")}</Label>
                <ColorSelect
                  value={primaryColor}
                  onValueChange={setPrimaryColor}
                  placeholder={t("company.primaryColorPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">{t("company.secondaryColor")}</Label>
                <ColorSelect
                  value={secondaryColor}
                  onValueChange={setSecondaryColor}
                  placeholder={t("company.secondaryColorPlaceholder")}
                />
              </div>
            </div>

            {/* Sección de información fiscal */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">{t("company.taxInfo")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="country">{t("company.country")}</Label>
                  <Select
                    value={countryId ? String(countryId) : ""}
                    onValueChange={handleCountryChange}
                    disabled={isLoadingCountries}
                  >
                    <SelectTrigger id="country" className="w-full">
                      <SelectValue placeholder={t("company.selectCountry")} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries?.map((country) => (
                        <SelectItem key={country.id} value={String(country.id)}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{t("company.city")}</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t("company.cityPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t("company.address")}</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("company.addressPlaceholder")}
                  />
                </div>

                {selectedCountry && selectedCountry.taxDocumentTypes.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="taxDocumentNumber" className="flex items-baseline gap-2">
                        {selectedCountry.taxDocumentTypes[0].name}
                        <span className="text-sm text-muted-foreground">
                          ({selectedCountry.taxDocumentTypes[0].code})
                        </span>
                      </Label>
                      <Input
                        id="taxDocumentNumber"
                        value={taxDocumentNumber}
                        onChange={(e) => setTaxDocumentNumber(e.target.value)}
                        placeholder={`${t("company.taxDocumentNumberPlaceholder")} ${selectedCountry.taxDocumentTypes[0].name}`}
                      />
                    </div>

                    {selectedCountry.taxDocumentTypes[0].hasCheckDigit && (
                      <div className="space-y-2">
                        <Label htmlFor="taxCheckDigit">{t("company.taxCheckDigit")}</Label>
                        <Input
                          id="taxCheckDigit"
                          value={taxCheckDigit}
                          onChange={(e) => setTaxCheckDigit(e.target.value)}
                          placeholder={t("company.taxCheckDigitPlaceholder")}
                          maxLength={1}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sección de contacto */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">{t("company.contactInfo")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone1">{t("company.phone1")}</Label>
                  <Input
                    id="phone1"
                    type="tel"
                    value={phone1}
                    onChange={(e) => setPhone1(e.target.value)}
                    placeholder={t("company.phone1Placeholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone2">{t("company.phone2")}</Label>
                  <Input
                    id="phone2"
                    type="tel"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    placeholder={t("company.phone2Placeholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email1">{t("company.email1")}</Label>
                  <Input
                    id="email1"
                    type="email"
                    value={email1}
                    onChange={(e) => setEmail1(e.target.value)}
                    placeholder={t("company.email1Placeholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email2">{t("company.email2")}</Label>
                  <Input
                    id="email2"
                    type="email"
                    value={email2}
                    onChange={(e) => setEmail2(e.target.value)}
                    placeholder={t("company.email2Placeholder")}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t">
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? t("common.saving") : t("company.saveChanges")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
