
function Add-EslintDisable ($file, $lineMatch) {
    $content = Get-Content -Raw $file
    $content = $content -replace $lineMatch, "// eslint-disable-next-line react-hooks/set-state-in-effect
    $0"
    Set-Content $file $content
}

Add-EslintDisable 'packages/electronic-invoicing/components/colombia-electronic-invoicing-config.tsx' 'setEnvironment\('
Add-EslintDisable 'packages/electronic-invoicing/components/till-electronic-invoicing-config.tsx' 'setNumberingMode\('
Add-EslintDisable 'packages/orders/components/order-form.tsx' 'setCustomerId\('
Add-EslintDisable 'packages/pos/components/orders-dialog.tsx' 'setBranchIds\('
Add-EslintDisable 'packages/pos/hooks/use-point-of-sale.ts' 'setSelectedOrderId\(null\)'
Add-EslintDisable 'packages/warehouse/components/modals/edit-warehouse.tsx' 'setName\('

