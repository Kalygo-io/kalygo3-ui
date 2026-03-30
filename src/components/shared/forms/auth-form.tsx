"use client";

import { useState } from "react";
import { CONFIG } from "@/config";
import { requestLoginCode } from "@/services/requestLoginCode";
import { verifyLoginCode } from "@/services/verifyLoginCode";
import { errorReporter } from "@/shared/errorReporter";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/shared/common/spinner";

type Step = "email" | "code";

export const AuthForm = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await requestLoginCode(email);
      setStep("code");
    } catch (err) {
      errorReporter(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await verifyLoginCode(email, code);
      router.push("/dashboard");
    } catch (err) {
      setIsLoading(false);
      errorReporter(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-black rounded shadow-md">
        <div className="text-center text-3xl">🔵</div>
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-200">
            {CONFIG.applicationName}
          </h1>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-200">
          {step === "email" ? "Sign In" : "Check your email"}
        </h2>
        <p className="text-sm text-center text-gray-400">
          {step === "email"
            ? "Enter your email to receive a sign-in code"
            : `We sent a 6-digit code to ${email}`}
        </p>

        {step === "email" ? (
          <form className="space-y-6" onSubmit={handleRequestCode}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-200"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="bg-gray-800 w-full px-3 py-2 mt-1 border border-gray-700 text-gray-200 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? <Spinner /> : "Send Code"}
            </button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleVerifyCode}>
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-200"
              >
                6-digit code
              </label>
              <input
                type="text"
                id="code"
                name="code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoFocus
                inputMode="numeric"
                maxLength={6}
                className="bg-gray-800 w-full px-3 py-2 mt-1 border border-gray-700 text-gray-200 rounded shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-2xl tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? <Spinner /> : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); }}
              className="w-full text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
