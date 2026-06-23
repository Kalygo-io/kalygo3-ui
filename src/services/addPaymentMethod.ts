import { apiPost, getAuthApiBaseUrl } from "./lib/api";

export interface AddPaymentMethodRequest {
  payment_method_id: string;
}

export interface AddPaymentMethodResponse {
  success: boolean;
  payment_method: any;
  stripe_customer_id: string;
  message: string;
}

/**
 * Add a payment method to the user's Stripe customer
 * The payment_method_id should be created using Stripe.js first
 */
export async function addPaymentMethod(
  paymentMethodId: string
): Promise<AddPaymentMethodResponse> {
  return apiPost<AddPaymentMethodResponse>(
    "/api/payments/payment-methods",
    {
      payment_method_id: paymentMethodId,
    },
    { baseUrl: getAuthApiBaseUrl() }
  );
}
