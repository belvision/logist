import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/shared/context/auth-context";
import { ThemeProvider } from '@/components/theme';
import { Toaster } from '@/components/ui';

export const metadata: Metadata = {
  title: "LogisticPro",
  description: "Современная система управления логистикой",
};

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <div className="bg-gradient"/>
        <ThemeProvider>
              <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
