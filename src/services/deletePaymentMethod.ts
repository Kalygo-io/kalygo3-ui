import { apiDelete, getAuthApiBaseUrl } from "./lib/api";

export interface DeletePaymentMethodResponse {
  success: boolean;
  message: string;
  payment_method_id: string;
}

/**
 * Delete a payment method for the authenticated user
 * DELETE /api/payments/payment-methods/{payment_method_id}
 */
export async function deletePaymentMethod(
  paymentMethodId: string
): Promise<DeletePaymentMethodResponse> {
  return apiDelete<DeletePaymentMethodResponse>(
    `/api/payments/payment-methods/${paymentMethodId}`,
    undefined,
    { baseUrl: getAuthApiBaseUrl() }
  );
}
