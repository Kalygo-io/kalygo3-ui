import { apiGet, getAuthApiBaseUrl } from "./lib/api";

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details?: {
    name?: string;
  };
  isDefault?: boolean;
}

/**
 * Get saved payment methods from Stripe
 * Uses a Next.js API route that reads the JWT cookie server-side
 * and forwards the request with Bearer token authentication
 */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const data = await apiGet<{
    payment_methods?: PaymentMethod[];
    stripe_customer_id?: string;
  }>("/api/payments/payment-methods", { baseUrl: getAuthApiBaseUrl() });
  // Backend returns { payment_methods: [...], stripe_customer_id: "..." }
  return data.payment_methods || [];
}
