import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPostHogClient, shutdownPostHog } from "@/lib/posthog-server";

export async function POST(request: Request) {
  try {
    // Get JWT token from cookies (server-side)
    const cookieStore = await cookies();
    const jwtCookie = cookieStore.get("jwt");

    if (!jwtCookie?.value) {
      return NextResponse.json(
        { error: "Authentication token not found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cardNumber, expMonth, expYear, cvv, cardholderName, billingZip } = body;

    // Validate required fields
    if (!cardNumber || !expMonth || !expYear || !cvv) {
      return NextResponse.json(
        { error: "Missing required card fields" },
        { status: 400 }
      );
    }

    // Create payment method via backend endpoint that handles Stripe
    // The backend should have an endpoint that creates a payment method from card details
    // For now, we'll send card details to backend which will create the payment method
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_AI_API_URL}/api/payments/create-payment-method`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtCookie.value}`,
        },
        body: JSON.stringify({
          card_number: cardNumber.replace(/\s/g, ""),
          exp_month: parseInt(expMonth),
          exp_year: parseInt(expYear),
          cvv: cvv,
          cardholder_name: cardholderName,
          billing_zip: billingZip,
        }),
      }
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Failed to create payment method:", resp.status, errorText);
      return NextResponse.json(
        { error: errorText || `Failed to create payment method: ${resp.status}` },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const posthogClient = getPostHogClient();
    posthogClient.capture({ distinctId: "server", event: "payment_method_created" });
    await shutdownPostHog();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in create payment method API route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

