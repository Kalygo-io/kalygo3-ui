"use client";

import { useState, useEffect } from "react";
import {
  Cog6ToothIcon,
  CreditCardIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { getCurrentUser } from "@/services/getCurrentUser";
import { getPaymentMethods, PaymentMethod } from "@/services/getPaymentMethods";
import { addPaymentMethod } from "@/services/addPaymentMethod";
import { deletePaymentMethod } from "@/services/deletePaymentMethod";
import { errorReporter } from "@/shared/errorReporter";
import { Spinner } from "@/components/shared/common/spinner";
import { successToast } from "@/shared/toasts";
import { StripePaymentForm } from "@/components/shared/stripe-payment-form";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export function SettingsContainer() {
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getCurrentUser();
        setEmail(user.email);
      } catch (err) {
        errorReporter(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchPaymentMethods() {
      try {
        const methods = await getPaymentMethods();
        setPaymentMethods(methods);
      } catch (err) {
        errorReporter(err);
      } finally {
        setIsLoadingPaymentMethods(false);
      }
    }
    fetchPaymentMethods();
  }, []);

  const handleDeleteCard = async (paymentMethodId: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) {
      return;
    }
    try {
      await deletePaymentMethod(paymentMethodId);

      // Remove from local state
      setPaymentMethods(
        paymentMethods.filter((pm) => pm.id !== paymentMethodId)
      );

      successToast("Payment method deleted successfully");
    } catch (err) {
      errorReporter(err);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes("visa")) return "💳";
    if (brandLower.includes("mastercard")) return "💳";
    if (brandLower.includes("amex") || brandLower.includes("american"))
      return "💳";
    if (brandLower.includes("discover")) return "💳";
    return "💳";
  };

  const formatExpiry = (month: number, year: number) => {
    return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
  };

  const handlePaymentMethodCreated = async (paymentMethodId: string) => {
    try {
      // Attach the payment method to the customer using the backend endpoint
      await addPaymentMethod(paymentMethodId);

      successToast("Payment method added successfully!");

      // Refresh payment methods list
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      throw err; // Re-throw to be handled by StripePaymentForm
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Cog6ToothIcon className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>
          <p className="text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Account Settings */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Account Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Spinner />
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                ) : (
                  <p className="text-white text-sm font-mono bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-700">
                    {email || "Not available"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Saved Payment Methods */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCardIcon className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Saved Payment Methods
              </h2>
            </div>
            {isLoadingPaymentMethods ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
                <span className="ml-2 text-gray-400">
                  Loading payment methods...
                </span>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCardIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No saved payment methods</p>
                <p className="text-gray-500 text-sm mt-1">
                  Add a payment method below to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 flex items-center justify-between hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="text-2xl">
                        {pm.card ? getCardBrandIcon(pm.card.brand) : "💳"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-semibold">
                            {pm.card
                              ? `${pm.card.brand.toUpperCase()} •••• ${
                                  pm.card.last4
                                }`
                              : "Card"}
                          </span>
                          {pm.isDefault && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs font-medium rounded">
                              <CheckCircleIcon className="w-3 h-3" />
                              <span>Default</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                          {pm.card && (
                            <>
                              <span>
                                Expires{" "}
                                {formatExpiry(
                                  pm.card.exp_month,
                                  pm.card.exp_year
                                )}
                              </span>
                              {pm.billing_details?.name && (
                                <span>• {pm.billing_details.name}</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCard(pm.id)}
                      className="ml-4 p-2 hover:bg-red-600/20 rounded-lg transition-colors group"
                      title="Delete payment method"
                    >
                      <TrashIcon className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Payment Method */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCardIcon className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Add Payment Method
              </h2>
            </div>
            {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  onPaymentMethodCreated={handlePaymentMethodCreated}
                  onError={errorReporter}
                />
              </Elements>
            ) : (
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 text-yellow-400 text-sm">
                Stripe publishable key not configured. Please set
                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment
                variables.
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Notifications
                  </label>
                  <p className="text-gray-400 text-sm">
                    Receive email updates about your account
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
