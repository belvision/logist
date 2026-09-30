'use client';

import { LandingLayout } from "@/components/layout/LandingLayout";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft,
  CheckCircle,
  X,
  ExternalLink,
  Zap,
  Shield,
  BarChart3,
  MessageCircle,
  FileText,
  Smartphone,
  Globe,
  Settings,
  CreditCard
} from "lucide-react";

export default function LicensesPage() {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/registry');
  };

  const freeFeatures = [
    {
      icon: CheckCircle,
      title: "Регистрация и создание профиля",
      description: "Полностью бесплатно"
    },
    {
      icon: CheckCircle,
      title: "Добавление транспорта",
      description: "Неограниченное количество единиц"
    },
    {
      icon: CheckCircle,
      title: "Просмотр грузов",
      description: "Доступ ко всей базе грузов"
    },
    {
      icon: CheckCircle,
      title: "Отклики на заказы",
      description: "Неограниченное количество откликов"
    },
    {
      icon: CheckCircle,
      title: "Базовый мессенджер",
      description: "Общение с грузовладельцами"
    },
    {
      icon: CheckCircle,
      title: "GPS-мониторинг",
      description: "Отслеживание транспорта в реальном времени"
    },
    {
      icon: CheckCircle,
      title: "Электронные документы",
      description: "Создание базовых документов"
    },
    {
      icon: CheckCircle,
      title: "Telegram бот",
      description: "Полный функционал через Telegram бот"
    }
  ];

  const paidFeatures = [
    {
      icon: CreditCard,
      title: "Интеграция с CRM системами",
      description: "Автоматическая синхронизация данных с вашей CRM",
      note: "При использовании нашего открытого API интеграция бесплатна"
    },
    {
      icon: BarChart3,
      title: "Расширенная аналитика",
      description: "Детальные отчеты по доходам, маршрутам и эффективности"
    },
    {
      icon: Zap,
      title: "Приоритетные уведомления",
      description: "Первыми получайте информацию о новых грузах"
    },
    {
      icon: Shield,
      title: "Расширенная проверка контрагентов",
      description: "Дополнительные проверки надежности грузовладельцев"
    },
    {
      icon: MessageCircle,
      title: "Премиум поддержка",
      description: "Приоритетная техническая поддержка 24/7"
    },
    {
      icon: FileText,
      title: "Расширенный документооборот",
      description: "Автоматическое создание сложных документов и шаблонов"
    }
  ];

  const apiFeatures = [
    {
      title: "REST API",
      description: "Полный доступ к API для интеграции с вашими системами",
      free: true
    },
    {
      title: "Webhook уведомления",
      description: "Получение уведомлений о событиях в реальном времени",
      free: true
    },
    {
      title: "SDK для разработчиков",
      description: "Готовые библиотеки для популярных языков программирования",
      free: true
    },
    {
      title: "Техническая поддержка API",
      description: "Помощь в интеграции и настройке",
      free: true
    }
  ];

  return (
    <>
      <Head>
        <title>Лицензии и тарифы LogistGo.pro | Что бесплатно, что платно</title>
        <meta name="description" content="Узнайте, что доступно бесплатно на LogistGo.pro, а какие функции требуют подписки. Бесплатные: регистрация, добавление транспорта, поиск грузов. Платные: CRM интеграция, аналитика, приоритетные уведомления." />
        <meta name="keywords" content="тарифы LogistGo.pro, бесплатные функции, платные функции, лицензии, CRM интеграция, API, грузоперевозки, Беларусь, Россия, Казахстан" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://logistgo.pro/carriers/licenses" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Лицензии и тарифы LogistGo.pro" />
        <meta property="og:description" content="Что доступно бесплатно, а какие функции требуют подписки. Бесплатное API для интеграций." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://logistgo.pro/carriers/licenses" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Лицензии и тарифы LogistGo.pro",
              "description": "Информация о бесплатных и платных функциях",
              "url": "https://logistgo.pro/carriers/licenses",
              "mainEntity": {
                "@type": "Service",
                "name": "LogistGo.pro",
                "description": "Биржа грузоперевозок",
                "offers": [
                  {
                    "@type": "Offer",
                    "name": "Бесплатный тариф",
                    "description": "Регистрация, добавление транспорта, поиск грузов"
                  },
                  {
                    "@type": "Offer", 
                    "name": "CRM интеграция",
                    "description": "Интеграция с CRM системами"
                  }
                ]
              }
            })
          }}
        />
      </Head>
      <LandingLayout>
        <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <Button 
                onClick={() => router.back()}
                variant="ghost"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
              <Button 
                onClick={handleRegister}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Зарегистрироваться
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Зачем нужны лицензии на LogistGo.pro
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Узнайте, что доступно бесплатно, а какие функции требуют подписки
            </p>
          </div>

          {/* Free Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Что доступно бесплатно
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {freeFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-0">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Paid Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Платные функции
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {paidFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-0">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-gray-600 mb-3">
                            {feature.description}
                          </p>
                          {feature.note && (
                            <div className="mt-3">
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {feature.note}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* API Section */}
          <div className="mb-16">
            <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">
                    Открытое API - полностью бесплатно
                  </h2>
                  <p className="text-xl text-purple-100">
                    Используйте наше API для интеграции с вашими системами без дополнительной платы
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {apiFeatures.map((feature, index) => (
                    <div key={index} className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                        <span className="text-green-300 text-sm font-bold">БЕСПЛАТНО</span>
                      </div>
                      <p className="text-purple-100 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <Button 
                    onClick={() => window.open('http://0.0.0.0:5555/docs', '_blank')}
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Открыть документацию API
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Сравнение тарифов
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Функция</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Бесплатно</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Платно</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Регистрация и профиль</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Добавление транспорта</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Просмотр грузов</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">CRM интеграция</td>
                    <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-blue-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Расширенная аналитика</td>
                    <td className="px-6 py-4 text-center"><X className="h-5 w-5 text-gray-400 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-blue-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">API доступ</td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">
                  Начните с бесплатного аккаунта
                </h2>
                <p className="text-xl text-green-100 mb-8">
                  Большинство функций LogistGo.pro доступны бесплатно. 
                  Платные функции можно подключить позже при необходимости.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={handleRegister}
                    size="lg"
                    className="bg-white text-green-600 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Создать бесплатный аккаунт
                  </Button>
                  <Button 
                    onClick={() => router.push('/carriers')}
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 font-bold text-lg px-8 py-4 rounded-lg"
                  >
                    Вернуться к лендингу
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LandingLayout>
    </>
  );
}
