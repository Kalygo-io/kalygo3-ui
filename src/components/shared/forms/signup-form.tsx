"use client";

import { useState } from "react";
import { CONFIG } from "@/config";
import { registerAccount } from "@/services/registerAccount";
import { loginRequest } from "@/services/loginRequest";
import { errorReporter } from "@/shared/errorReporter";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/shared/common/spinner";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export const SignupForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleRegister = async (e: { preventDefault: () => void }) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      await registerAccount(email, password, newsletterSubscribed);
      console.log("after registerAccount...");
      await loginRequest(email, password);
      router.push("/dashboard");
    } catch (err) {
      setIsLoading(false);
      errorReporter(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-2xl">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to home</span>
        </Link>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-xl mb-4">
            <span className="text-white text-2xl font-bold">K</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {CONFIG.applicationName}
          </h1>
          <h2 className="text-2xl font-semibold text-gray-300">Get started</h2>
          <p className="text-gray-400 mt-2">Create your account to begin</p>
        </div>

        <form className="space-y-6" onSubmit={handleRegister}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-900/50 w-full px-4 py-3 border border-gray-700 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-900/50 w-full px-4 py-3 border border-gray-700 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="newsletter"
                name="newsletter"
                checked={newsletterSubscribed}
                onChange={(e) => setNewsletterSubscribed(e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-900/50 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
              />
            </div>
            <label
              htmlFor="newsletter"
              className="ml-3 text-sm text-gray-300 cursor-pointer select-none"
            >
              Subscribe to our newsletter for updates and announcements
            </label>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Spinner /> : "Create Account"}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-700">
          <p className="text-sm text-center text-gray-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
