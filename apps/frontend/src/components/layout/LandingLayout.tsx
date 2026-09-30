'use client';

import { CookieConsent } from "@/components/CookieConsent";
import { LandingNav } from "./LandingNav";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export const LandingLayout = ({ children }: LandingLayoutProps) => {
  return (
    <div className="min-h-screen">
      <LandingNav />
      {children}
      <CookieConsent />
    </div>
  );
};
