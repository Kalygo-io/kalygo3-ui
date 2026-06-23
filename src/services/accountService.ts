import { apiGet, apiPut, getAuthApiBaseUrl } from "./lib/api";

const AUTH = { baseUrl: getAuthApiBaseUrl() };

export interface Account {
  id: number;
  email: string;
  newsletter_subscribed: boolean;
  stripe_customer_id: string | null;
}

export interface UpdateAccountRequest {
  email?: string;
  newsletter_subscribed?: boolean;
}

export async function getAccount(): Promise<Account> {
  return apiGet<Account>("/api/accounts/me", AUTH);
}

export async function updateAccount(data: UpdateAccountRequest): Promise<Account> {
  return apiPut<Account>("/api/accounts/me", data, AUTH);
}
