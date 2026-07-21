-- TheFactory and DIAN require the official Colombia identification-type codes.
-- This updates only Colombia's catalog; existing company and customer records remain unchanged.
UPDATE "Country"
SET
  "taxDocumentTypes" = jsonb_build_array(
    jsonb_build_object('code', '11', 'name', 'Registro civil', 'hasCheckDigit', false),
    jsonb_build_object('code', '12', 'name', 'Tarjeta de identidad', 'hasCheckDigit', false),
    jsonb_build_object('code', '13', 'name', 'Cedula de ciudadania', 'hasCheckDigit', false),
    jsonb_build_object('code', '21', 'name', 'Tarjeta de extranjeria', 'hasCheckDigit', false),
    jsonb_build_object('code', '22', 'name', 'Cedula de extranjeria', 'hasCheckDigit', false),
    jsonb_build_object('code', '31', 'name', 'NIT', 'hasCheckDigit', true),
    jsonb_build_object('code', '41', 'name', 'Pasaporte', 'hasCheckDigit', false),
    jsonb_build_object('code', '42', 'name', 'Documento de identificacion extranjero', 'hasCheckDigit', false),
    jsonb_build_object('code', '47', 'name', 'PEP (Permiso Especial de Permanencia)', 'hasCheckDigit', false),
    jsonb_build_object('code', '48', 'name', 'PPT (Permiso Proteccion Temporal)', 'hasCheckDigit', false),
    jsonb_build_object('code', '50', 'name', 'NIT de otro pais', 'hasCheckDigit', false),
    jsonb_build_object('code', '91', 'name', 'NUIP', 'hasCheckDigit', false)
  ),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'CO';
