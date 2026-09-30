'use client';

import { LandingLayout } from "@/components/layout/LandingLayout";
import { FAQ, commonFAQs } from "@/components/seo/FAQ";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CountryCard } from "@/components/CountryCard";
import { getAllCountries } from "@/data/countries";
import { useTranslation } from 'react-i18next';
import { 
  Truck, 
  Package, 
  Shield, 
  Users, 
  CheckCircle, 
  Phone,
  Mail,
  ArrowRight,
  Zap,
  Heart,
  Award,
  MessageCircle,
  Instagram,
  Facebook,
  Globe
} from "lucide-react";
import { BackgroundImage } from "@/components/landing/BackgroundImage";
import { backgroundImages } from "@/lib/background-images";

// Structured Data JSON-LD
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "LogistGo.pro",
  "description": "Международная биржа грузоперевозок",
  "url": "https://logistgo.pro",
  "logo": "https://logistgo.pro/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+375-29-573-08-44",
    "contactType": "customer service",
    "email": "5730844@gmail.com"
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "BY"
  },
  "sameAs": [
    "https://t.me/logistgoBot",
    "https://instagram.com/logistgo_pro",
    "https://vk.com/logistgo_pro"
  ]
};

export default function Home() {
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
          imageUrl={backgroundImages.home.hero}
          gradientClass="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"
          overlayOpacity={0.4}
          showPattern={true}
          className="min-h-screen flex items-center justify-center"
        >
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                {t('hero.title')}
                <br />
                <span className="text-blue-300">{t('hero.subtitle')}</span>
                <br />
                <span className="text-yellow-400">{t('hero.brand')}</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                {t('hero.description')}
              </p>
            </div>

            <div className="flex flex-col max-w-[300px] gap-4 justify-center items-center mx-auto mb-12">
              <Link 
                href="/registry"
                className="inline-flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-4 rounded-lg shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300"
              >
                {t('hero.register')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>

              <Link 
                href="/login"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-8 py-4 rounded-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
              >
                {t('hero.login')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            {/* Contact Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-white text-lg mb-2">{t('hero.database')}</p>
              <p className="text-blue-200 text-xl font-semibold mb-4">{t('hero.source')}</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-blue-100 mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-300" />
                  <span className="text-sm">Telegram</span>
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-300" />
                  <span className="text-sm">Instagram</span>
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-blue-300" />
                  <span className="text-sm">ВКонтакте</span>
                </div>
              </div>
              <Link 
                href="/social-cargo"
                className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <Package className="mr-2 h-5 w-5" />
                Смотреть грузы из социальных сетей
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            </div>
          </div>
        </BackgroundImage>

        {/* Stats Section */}
        <section className="py-25 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <Package className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('stats.cargo.title')}</h3>
                  <p className="text-gray-600">{t('stats.cargo.description')}</p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <Truck className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('stats.transport.title')}</h3>
                  <p className="text-gray-600">{t('stats.transport.description')}</p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <Users className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('stats.users.title')}</h3>
                  <p className="text-gray-600">{t('stats.users.description')}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-25 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('features.title')}</h2>
              <p className="text-xl text-gray-600">{t('features.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Безопасно */}
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-6">
                    <Shield className="h-12 w-12 text-green-600 mr-4" />
                    <h3 className="text-2xl font-bold text-gray-900">{t('features.safe.title')}</h3>
                  </div>
                  <ul className="space-y-4 text-gray-600">
                    {(t('features.safe.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Удобно */}
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-6">
                    <Zap className="h-12 w-12 text-blue-600 mr-4" />
                    <h3 className="text-2xl font-bold text-gray-900">{t('features.convenient.title')}</h3>
                  </div>
                  <ul className="space-y-4 text-gray-600">
                    {(t('features.convenient.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Бесплатно */}
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-6">
                    <Heart className="h-12 w-12 text-red-600 mr-4" />
                    <h3 className="text-2xl font-bold text-gray-900">{t('features.free.title')}</h3>
                  </div>
                  <ul className="space-y-4 text-gray-600">
                    {(t('features.free.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Countries Section */}
        <section className="py-25 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center mb-4">
                <Globe className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('countries.title')}</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t('countries.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {getAllCountries().map((country) => (
                <CountryCard
                  key={country.code}
                  flag={country.flag}
                  nameRu={country.nameRu}
                  nameLocal={country.nameLocal || ''}
                  slug={country.slug}
                  description={country.description.ru}
                />
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-6">
                {t('countries.selectCountry')}
              </p>
              <Link 
                href="/registry"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {t('countries.joinButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* How to Start Section */}
        <section className="py-25 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('howToStart.title')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('howToStart.steps.title')}</h3>
                    <p className="text-gray-600 mb-6">
                      {t('howToStart.steps.description')}
                    </p>
                    <Link 
                      href="/carriers/7-steps"
                      className="inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-lg"
                    >
                      {t('howToStart.steps.button')}
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('howToStart.transport.title')}</h3>
                    <p className="text-gray-600 mb-6">
                      {t('howToStart.transport.description')}
                    </p>
                    <Link 
                      href="/carriers/add-transport"
                      className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg"
                    >
                      {t('howToStart.transport.button')}
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('howToStart.licenses.title')}</h3>
                    <p className="text-gray-600 mb-6">
                      {t('howToStart.licenses.description')}
                    </p>
                    <Link 
                      href="/carriers/licenses"
                      className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg"
                    >
                      {t('howToStart.licenses.button')}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-25 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('team.title')}</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
                {t('team.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-gray-900 font-medium">Сергей Гаев</span>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-gray-900 font-medium">Александр Калиновский</span>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-gray-900 font-medium">Александр Прусенок</span>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-gray-900 font-medium">Павел Нагай</span>
              </div>
            </div>

            <div className="text-center">
              <Link 
                href="/team"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Users className="mr-2 h-5 w-5" />
                {t('team.moreButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-25 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              {t('cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/cargo-owners"
                className="inline-flex items-center justify-center bg-white text-blue-600 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Package className="mr-2 h-5 w-5" />
                {t('cta.cargoOwners')}
              </Link>
              <Link 
                href="/carriers"
                className="inline-flex items-center justify-center bg-yellow-500 text-black hover:bg-yellow-600 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Truck className="mr-2 h-5 w-5" />
                {t('cta.carriers')}
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-17">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">LogistGo.pro</h3>
              <p className="text-gray-400 mb-6">
                {t('footer.representative')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-gray-300 mb-6">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>5730844@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+375 29 573 08 44</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>УНП 191711739</span>
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
      <FAQ faqs={commonFAQs} />
    </LandingLayout>
    </>
  );
}
