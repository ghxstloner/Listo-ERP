import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer } from "@/packages/customers/types";
import type { Seller } from "@/packages/sellers/types";
import type { CartItem, PaymentMethod } from "../types";
import { TicketCheckout } from "./ticket-checkout";
import { PaymentMethodSelector } from "./payment-method-selector";
import { TicketItem } from "./ticket-item";
import { TicketSelector } from "./ticket-selector";
import { TicketSummary } from "./ticket-summary";

interface TicketProps {
  cart: CartItem[];
  customer: Customer | null;
  customers: Customer[];
  seller: Seller | null;
  sellers: Seller[];
  paymentMethod: PaymentMethod | null;
  paymentMethods: PaymentMethod[];
  paymentReference: string;
  subtotal: number;
  tax: number;
  total: number;
  canCharge: boolean;
  charging?: boolean;
  stockByProduct: Map<number, number>;
  onCustomerChange: (id: string) => void;
  onSellerChange: (id: string) => void;
  onPaymentMethodChange: (id: string) => void;
  onPaymentReferenceChange: (value: string) => void;
  onQuantityChange: (productId: number, quantity: number) => void;
  onCharge: () => void;
}

export function Ticket(props: TicketProps) {
  const itemCount = props.cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <aside className="min-h-0 min-w-0">
      <Card className="h-full gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="text-base">Ticket actual</CardTitle>
          <p className="text-muted-foreground text-xs">{itemCount} artículos</p>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-5">
          <div className="shrink-0 grid gap-3">
            <TicketSelector label="Cliente" value={props.customer ? String(props.customer.id) : undefined} onChange={props.onCustomerChange} items={props.customers} />
            <TicketSelector label="Vendedor" value={props.seller ? String(props.seller.id) : undefined} onChange={props.onSellerChange} items={props.sellers} />
          </div>
          <div className="min-h-0 flex-1 divide-y overflow-y-auto border-y">
            {props.cart.length === 0 ? <p className="text-muted-foreground py-10 text-center text-sm">Agrega productos para iniciar el ticket.</p> : props.cart.map((item) => (
              <TicketItem key={item.product.id} item={item} availableStock={props.stockByProduct.get(item.product.id) ?? 0} onQuantityChange={props.onQuantityChange} />
            ))}
          </div>
           <TicketSummary subtotal={props.subtotal} tax={props.tax} total={props.total} />
           <PaymentMethodSelector paymentMethod={props.paymentMethod} paymentMethods={props.paymentMethods} onChange={props.onPaymentMethodChange} />
           {props.paymentMethod?.requiresReference && (
             <div className="shrink-0 space-y-2">
               <Label htmlFor="paymentReference">Referencia de pago</Label>
               <Input
                 id="paymentReference"
                 value={props.paymentReference}
                 onChange={(event) => props.onPaymentReferenceChange(event.target.value)}
                 placeholder="Número de transacción o autorización"
                 maxLength={100}
               />
             </div>
           )}
           <TicketCheckout total={props.total} loading={props.charging} disabled={!props.canCharge || !props.customer || !props.seller || !props.paymentMethod || (props.paymentMethod.requiresReference && !props.paymentReference.trim()) || props.cart.length === 0} onCharge={props.onCharge} />
        </CardContent>
      </Card>
    </aside>
  );
}
