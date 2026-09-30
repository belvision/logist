'use client';

import { LandingLayout } from "@/components/layout/LandingLayout";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import { BackgroundImage } from "@/components/landing/BackgroundImage";
import { backgroundImages } from "@/lib/background-images";
import { 
  Truck, 
  Shield, 
  ArrowRight,
  MessageCircle,
  Instagram,
  Facebook,
  Zap,
  ShieldCheck,
  BarChart3,
  Smartphone,
  Eye,
  Globe,
  Star
} from "lucide-react";

// Structured Data JSON-LD
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Для перевозчиков - LogistGo.pro",
  "description": "Быстрый поиск грузов для перевозчиков",
  "url": "https://logistgo.pro/carriers",
  "mainEntity": {
    "@type": "Service",
    "name": "Поиск грузов",
    "description": "Сервис поиска грузов для перевозчиков",
    "provider": {
      "@type": "Organization",
      "name": "LogistGo.pro"
    }
  }
};

export default function CarriersPage() {
  const { t } = useTranslation();
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingLayout>
        <div className="min-h-screen">
        {/* Hero Section */}
        <BackgroundImage
          imageUrl={backgroundImages.carriers.hero}
          gradientClass="bg-gradient-to-br from-orange-900 via-orange-800 to-red-900"
          overlayOpacity={0.4}
          showPattern={true}
          className="min-h-screen flex items-center justify-center"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">

                <span className="text-orange-300">{t('carriers.hero.title')}</span>
                <br />
                <span className="text-yellow-400">{t('carriers.hero.subtitle')}</span>
              </h1>
              <p className="text-xl md:text-2xl text-orange-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                {t('carriers.hero.description')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                href="/registry"
                className="inline-flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-4 sm:px-8 py-4 rounded-lg shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 w-full sm:w-auto"
              >
                {t('carriers.hero.register')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            {/* Contact Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-white text-lg mb-2">{t('hero.database')}</p>
              <p className="text-orange-200 text-xl font-semibold mb-4">{t('hero.source')}</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-orange-100">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-orange-300" />
                  <span className="text-sm">Telegram</span>
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-300" />
                  <span className="text-sm">Instagram</span>
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-orange-300" />
                  <span className="text-sm">ВКонтакте</span>
                </div>
              </div>
            </div>
          </div>
        </BackgroundImage>

        {/* Main Actions Section */}
        <section className="py-25 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('carriers.mainSection.title')}</h2>
              <p className="text-xl text-gray-600 mb-8">{t('carriers.mainSection.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Truck className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{t('carriers.mainSection.participants.title')}</h3>
                    <p className="text-gray-600 text-sm">
                      {t('carriers.mainSection.participants.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{t('carriers.mainSection.international.title')}</h3>
                    <p className="text-gray-600 text-sm">
                      {t('carriers.mainSection.international.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <ArrowRight className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{t('carriers.mainSection.quickReg.title')}</h3>
                    <p className="text-gray-600 text-sm">
                      {t('carriers.mainSection.quickReg.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Link 
                href="/registry"
                className="inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg px-4 sm:px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
              >
                {t('carriers.mainSection.register')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Convenience Section */}
        <section className="py-25 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('carriers.convenience.title')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('carriers.convenience.workAnywhere.title')}</h3>
                    <p className="text-gray-600">
                      <a href="https://t.me/logistgoBot" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{t('carriers.convenience.workAnywhere.link')}</a> {t('carriers.convenience.workAnywhere.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('carriers.convenience.noManual.title')}</h3>
                    <p className="text-gray-600">
                      {t('carriers.convenience.noManual.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Safety Features Section */}
        <section className="py-25 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('carriers.safety.title')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <Shield className="h-8 w-8 text-green-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">{t('carriers.safety.passport.title')}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {t('carriers.safety.passport.description')}
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <Star className="h-8 w-8 text-yellow-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">{t('carriers.safety.rating.title')}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {t('carriers.safety.rating.description')}
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <ShieldCheck className="h-8 w-8 text-red-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">{t('carriers.safety.checks.title')}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {t('carriers.safety.checks.description')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Additional Features Section */}
        <section className="py-25 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('carriers.additional.analytics.title')}</h3>
                    <p className="text-gray-600">
                      {t('carriers.additional.analytics.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Smartphone className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('carriers.additional.mobile.title')}</h3>
                    <p className="text-gray-600">
                      {t('carriers.additional.mobile.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* Free Features Section */}
        <section className="py-25 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              {t('carriers.free.title')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Eye className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('carriers.free.seeContacts.title')}</h3>
                    <p className="text-gray-600">
                      {t('carriers.free.seeContacts.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Truck className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('carriers.free.addTransport.title')}</h3>
                    <p className="text-gray-600">
                      {t('carriers.free.addTransport.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Link 
              href="/registry"
              className="inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm sm:text-lg px-3 sm:px-8 py-3 sm:py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
            >
              <Truck className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{t('carriers.free.joinButton')}</span>
              <span className="sm:hidden">{t('carriers.free.joinButtonShort')}</span>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-17">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">LogistGo.pro</h3>
              <p className="text-gray-400 mb-6">
                {t('carriers.footer.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-gray-300 mb-6">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Telegram</span>
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  <span>Instagram</span>
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  <span>ВКонтакте</span>
                </div>
              </div>
              
              {/* Legal Links */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-gray-400 text-sm">
                <Link 
                  href="/privacy-policy" 
                  className="hover:text-white transition-colors underline"
                >
                  {t('footer.privacyPolicy')}
                </Link>
                <span className="hidden sm:inline">•</span>
                <Link 
                  href="/offer-agreement" 
                  className="hover:text-white transition-colors underline"
                >
                  {t('footer.offerAgreement')}
                </Link>
                <span className="hidden sm:inline">•</span>
                <span>{t('footer.copyright')}</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </LandingLayout>
    </>
  );
}
