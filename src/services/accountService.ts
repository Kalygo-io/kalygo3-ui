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
  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/accounts/me`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  if (!resp.ok) {
    const errorData = await resp
      .json()
      .catch(() => ({ error: "Unknown error" }));
    const errorMessage = errorData.error || `HTTP ${resp.status}`;
    throw new Error(`Failed to get account: ${errorMessage}`);
  }

  return resp.json();
}

export async function updateAccount(data: UpdateAccountRequest): Promise<Account> {
  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/accounts/me`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );

  if (!resp.ok) {
    const errorData = await resp
      .json()
      .catch(() => ({ error: "Unknown error" }));
    const errorMessage = errorData.error || `HTTP ${resp.status}`;
    throw new Error(`Failed to update account: ${errorMessage}`);
  }

  return resp.json();
}
