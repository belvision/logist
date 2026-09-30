import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/shared/context/auth-context";
import { NotificationProvider } from "@/shared/context/notifications-context";
import { ThemeProvider } from '@/components/theme';
import { Toaster } from '@/components/ui/toaster';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { YandexMetrica } from '@/components/analytics/YandexMetrica';
import { SessionManager } from '@/components/auth/SessionManager';
import { RecaptchaProvider } from '@/components/auth/RecaptchaProvider';
import { RecaptchaProviderFallback } from '@/components/auth/RecaptchaProviderFallback';
import NotificationsProvider from '@/components/NotificationsProvider';
import { I18nProvider } from '@/components/i18n';
import '@/lib/chunk-error-handler';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: {
    default: "LogistGo.pro - Международная биржа грузоперевозок",
    template: "%s"
  },
  description: "Международная биржа грузоперевозок LogistGo.pro. Помогает перевозчикам и грузоотправителям из Беларуси, России, Казахстана, Польши, Литвы найти друг друга и договориться о перевозке. Бесплатная регистрация.",
  keywords: ["грузоперевозки", "биржа грузоперевозок", "перевозчики", "грузоотправители", "Беларусь", "Россия", "Казахстан", "Польша", "Литва", "логистика", "транспорт", "грузы"],
  authors: [{ name: "LogistGo.pro" }],
  creator: "LogistGo.pro",
  publisher: "LogistGo.pro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://logistgo.pro'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://logistgo.pro',
    siteName: 'LogistGo.pro',
    title: 'LogistGo.pro - Международная биржа грузоперевозок',
    description: 'Помогает перевозчикам и грузоотправителям найти друг друга и договориться о перевозке. Бесплатная регистрация.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LogistGo.pro - Международная биржа грузоперевозок',
    description: 'Помогает перевозчикам и грузоотправителям найти друг друга и договориться о перевозке.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

const inter = Inter({ 
  subsets: ["latin", "cyrillic"],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <I18nProvider>
          <ThemeProvider>
                <AuthProvider>
                  <NotificationProvider>
                    <NotificationsProvider />
                    {process.env['NEXT_PUBLIC_DISABLE_RECAPTCHA'] === 'true' ? (
                      <RecaptchaProviderFallback>
                        {children}
                        <SessionManager />
                      </RecaptchaProviderFallback>
                    ) : (
                      <RecaptchaProvider>
                        {children}
                        <SessionManager />
                      </RecaptchaProvider>
                    )}
                  </NotificationProvider>
                </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
        <Toaster />
        <GoogleAnalytics />
        <YandexMetrica />
      </body>
    </html>
  );
}
