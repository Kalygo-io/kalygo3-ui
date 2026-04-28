import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "@/app/globals.css";
import "@/app/custom-scrollbar.css";
import "react-toastify/dist/ReactToastify.css";
import "@/app/react-markdown.css";
import { ReactQueryClientProvider } from "@/components/shared/providers/ReactQueryClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kalygo",
  description: "Made in Miami",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ReactQueryClientProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
          <ToastContainer />
        </body>
      </html>
    </ReactQueryClientProvider>
  );
}
