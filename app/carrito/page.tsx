import type { Metadata } from "next";
import CheckoutView from "@/components/ecommerce/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout | FabriColor",
  description: "Confirmá tu pedido web en FabriColor.",
};

export default function CarritoPage() {
  return <CheckoutView />;
}
