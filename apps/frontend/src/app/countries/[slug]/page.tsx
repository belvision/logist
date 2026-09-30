import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LandingLayout } from '@/components/layout/LandingLayout';
import { Card, CardContent } from '@/components/ui/card';
import {getCountryBySlug, getCountrySlugs } from '@/data/countries';
import {
  ArrowRight,
  Package,
  Truck,
  Shield,
  Star,
  MessageCircle,
  CheckCircle,
  Globe,
  Users,
  Clock
} from 'lucide-react';

// Генерация статических путей для всех стран
export async function generateStaticParams() {
  return getCountrySlugs().map((slug) => ({
    slug: slug,
  }));
}

// Генерация метаданных для каждой страны
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const country = getCountryBySlug(params.slug);

  if (!country) {
    return {
      title: 'Страна не найдена',
    };
  }

  return {
    title: `${country.nameRu} | Биржа грузоперевозок LogistGo.pro`,
    description: country.description.ru,
    keywords: country.keywords,
    alternates: {
      canonical: `/countries/${country.slug}`,
    },
    openGraph: {
      title: `LogistGo.pro в ${country.nameRu} ${country.flag}`,
      description: country.description.ru,
      url: `https://logistgo.pro/countries/${country.slug}`,
      type: 'website',
      locale: 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image',
      title: `LogistGo.pro в ${country.nameRu}`,
      description: country.description.ru,
    },
  };
}

export default function CountryPage({ params }: { params: { slug: string } }) {
  const country = getCountryBySlug(params.slug);

  if (!country) {
    notFound();
  }

  // Используем локальный язык если доступен, иначе русский
  const t = (obj: { ru: string; local?: string } | undefined): string => {
    if (!obj) return '';
    return obj.local || obj.ru;
  };

  // Structured Data для SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `LogistGo.pro - ${country.nameLocal || country.nameRu}`,
    description: t(country.description),
    provider: {
      '@type': 'Organization',
      name: 'LogistGo.pro',
      url: 'https://logistgo.pro',
    },
    areaServed: {
      '@type': 'Country',
      name: country.nameLocal || country.nameRu,
    },
    availableLanguage: country.languages,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingLayout>
        <div className="min-h-screen">
          {/* Hero Section */}
          <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-5xl mx-auto text-center">
              {/* Флаг */}
              <div className="text-8xl mb-6 animate-bounce">{country.flag}</div>

              <div className="mb-8">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                  {t(country.content.hero.title)}
                </h1>

                <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                  {t(country.content.hero.subtitle)}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  href="/registry"
                  className="inline-flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-4 rounded-lg shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300"
                >
                  Зарегистрироваться
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>

              {/* Info Badge */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 text-white text-lg mb-2">
                  <Globe className="h-5 w-5 text-blue-300" />
                  <span>LogistGo.pro - {country.nameLocal || country.nameRu}</span>
                </div>
                <p className="text-blue-200 text-sm">
                  {t(country.description)}
                </p>
              </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-25 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  {t(country.content.features.title)}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {country.content.features.items.map((feature, index) => (
                  <Card key={index} className="p-8 hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-0">
                      <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          {t(feature.title)}
                        </h3>
                        <p className="text-gray-600">
                          {t(feature.description)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Services Section */}
          <section className="py-25 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Наши услуги</h2>
                <p className="text-xl text-gray-600">
                  Все необходимое для успешной работы на LogistGo.pro
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-0">
                    <div className="flex items-start">
                      <Package className="h-8 w-8 text-green-600 mr-4 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Поиск грузов
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Тысячи актуальных грузов ежедневно. Найдите подходящий груз по вашему маршруту.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-0">
                    <div className="flex items-start">
                      <Truck className="h-8 w-8 text-blue-600 mr-4 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Поиск транспорта
                        </h3>
                        <p className="text-gray-600 text-sm">
                          База свободных машин. Найдите надежного перевозчика быстро.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-0">
                    <div className="flex items-start">
                      <Shield className="h-8 w-8 text-purple-600 mr-4 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Проверка участников
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Рейтинги, отзывы и проверки помогают выбрать надежного партнера.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-0">
                    <div className="flex items-start">
                      <MessageCircle className="h-8 w-8 text-indigo-600 mr-4 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Мессенджер
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Обсуждайте детали заказа прямо на платформе.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-0">
                    <div className="flex items-start">
                      <Star className="h-8 w-8 text-yellow-600 mr-4 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Рейтинговая система
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Оценки и отзывы помогают найти лучших в регионе.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-25 bg-gradient-to-r from-blue-600 to-indigo-700">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
                <div>
                  <Users className="h-12 w-12 mx-auto mb-4 text-blue-200" />
                  <div className="text-4xl font-bold mb-2">1000+</div>
                  <div className="text-blue-100">Активных пользователей</div>
                </div>
                <div>
                  <Truck className="h-12 w-12 mx-auto mb-4 text-blue-200" />
                  <div className="text-4xl font-bold mb-2">500+</div>
                  <div className="text-blue-100">Перевозчиков</div>
                </div>
                <div>
                  <Clock className="h-12 w-12 mx-auto mb-4 text-blue-200" />
                  <div className="text-4xl font-bold mb-2">24/7</div>
                  <div className="text-blue-100">Поддержка</div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-25 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Начните работать с LogistGo.pro в {country.nameRu}
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Присоединяйтесь к тысячам перевозчиков и грузовладельцев, которые уже используют нашу платформу
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/registry"
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Package className="mr-2 h-5 w-5" />
                  Зарегистрироваться бесплатно
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Все страны
                  <Globe className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </LandingLayout>
    </>
  );
}

