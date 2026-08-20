
const fs = require('fs');
let content = fs.readFileSync('src/products/products.service.ts', 'utf8');

content = content.replace(/taxRate:\s*createProductDto\.taxRate\s*!=\s*null\s*\?\s*new\s*Prisma\.Decimal\(createProductDto\.taxRate\)\s*:\s*null,/, 'taxId: createProductDto.taxId ?? null,');

content = content.replace(/if\s*\(updateProductDto\.taxRate\s*!==\s*undefined\)\s*\{[\s\S]*?\}/, 'if (updateProductDto.taxId !== undefined) { data.taxId = updateProductDto.taxId ?? null; }');

content = content.replace(/taxRate:\s*true,/, 'taxId: true, tax: true,');

content = content.replace(/taxRate:\s*Prisma\.Decimal\s*\|\s*null;/, 'taxId: number | null; tax?: { id: number; name: string; rate: Prisma.Decimal } | null;');

content = content.replace(/Omit<T, \'salePrice\' \| \'costPrice\' \| \'taxRate\'> & \{/, 'Omit<T, \'salePrice\' | \'costPrice\' | \'taxId\' | \'tax\'> & {');

content = content.replace(/taxRate:\s*number\s*\|\s*null;/, 'taxId: number | null; tax?: { id: number; name: string; rate: number } | null;');

content = content.replace(/taxRate:\s*product\.taxRate\s*!=\s*null\s*\?\s*Number\(product\.taxRate\)\s*:\s*null,/, 'taxId: product.taxId ?? null, tax: product.tax ? { ...product.tax, rate: Number(product.tax.rate) } : null,');

fs.writeFileSync('src/products/products.service.ts', content);

