'use client';

import { LandingLayout } from "@/components/layout/LandingLayout";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft,
  CheckCircle,
  User,
  Truck,
  Shield,
  Search,
  MessageCircle,
  Star,
  FileText,
  Smartphone,
  Globe
} from "lucide-react";

export default function SevenStepsPage() {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/registry');
  };

  const steps = [
    {
      number: 1,
      title: "Зарегистрируйтесь на LogistGo.pro",
      description: "Создайте аккаунт перевозчика, указав основную информацию о вашей компании",
      icon: User,
      details: "Заполните регистрационную форму, указав название компании, контактные данные и основные реквизиты. Это займет не более 5 минут."
    },
    {
      number: 2,
      title: "Добавьте информацию о транспорте",
      description: "Загрузите данные о ваших автомобилях, их характеристиках и документах",
      icon: Truck,
      details: "Укажите тип транспорта, грузоподъемность, габариты, марку и модель. Загрузите сканы документов на транспорт и водителей."
    },
    {
      number: 3,
      title: "Заполните профиль компании",
      description: "Добавьте подробную информацию о вашей компании и услугах",
      icon: Shield,
      details: "Расскажите о вашей компании, опыте работы, лицензиях и сертификатах. Это поможет грузовладельцам лучше понять ваши возможности."
    },
    {
      number: 4,
      title: "Настройте уведомления",
      description: "Выберите, какие уведомления вы хотите получать о новых грузах",
      icon: MessageCircle,
      details: "Настройте фильтры по маршрутам, типу груза, дате загрузки. Получайте уведомления только о подходящих предложениях."
    },
    {
      number: 5,
      title: "Изучите доступные грузы",
      description: "Просматривайте базу грузов и выбирайте подходящие по маршруту и типу",
      icon: Search,
      details: "Используйте фильтры для поиска грузов по направлению, типу, дате загрузки. Изучайте детали каждого предложения."
    },
    {
      number: 6,
      title: "Откликайтесь на заказы",
      description: "Связывайтесь с грузовладельцами и обсуждайте условия перевозки",
      icon: Star,
      details: "Отправляйте предложения по интересующим грузам. Общайтесь с заказчиками через встроенный мессенджер LogistGo.pro."
    },
    {
      number: 7,
      title: "Оформляйте документы",
      description: "Используйте электронный документооборот для оформления перевозки",
      icon: FileText,
      details: "Создавайте договоры, накладные и другие документы в электронном виде. Все данные подтягиваются автоматически."
    }
  ];

  return (
    <>
      <Head>
        <title>7 шагов для начала работы на LogistGo.pro | Руководство для перевозчиков</title>
        <meta name="description" content="Пошаговое руководство для перевозчиков: как начать работать на LogistGo.pro и получать заказы. 7 простых шагов от регистрации до первых заказов. Бесплатная регистрация." />
        <meta name="keywords" content="как начать работать перевозчиком, руководство перевозчика, LogistGo.pro, грузоперевозки, Беларусь, Россия, Казахстан, Польша, Литва" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://logistgo.pro/carriers/7-steps" />
        
        {/* Open Graph */}
        <meta property="og:title" content="7 шагов для начала работы на LogistGo.pro" />
        <meta property="og:description" content="Пошаговое руководство для перевозчиков: как начать работать и получать заказы." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://logistgo.pro/carriers/7-steps" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HowTo",
              "name": "7 шагов для начала работы на LogistGo.pro",
              "description": "Пошаговое руководство для перевозчиков",
              "url": "https://logistgo.pro/carriers/7-steps",
              "totalTime": "PT30M",
              "supply": [
                {
                  "@type": "HowToSupply",
                  "name": "Компьютер или мобильное устройство"
                },
                {
                  "@type": "HowToSupply", 
                  "name": "Документы на транспорт"
                }
              ],
              "step": steps.map((step, index) => ({
                "@type": "HowToStep",
                "position": step.number,
                "name": step.title,
                "text": step.description
              }))
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
                className="bg-orange-600 hover:bg-orange-700 text-white"
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
              7 шагов для начала успешной работы на LogistGo.pro
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Пошаговое руководство для перевозчиков, которые хотят начать получать заказы через нашу платформу
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Card key={step.number} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="md:flex">
                      {/* Step Number and Icon */}
                      <div className="md:w-1/3 bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                            <IconComponent className="h-8 w-8" />
                          </div>
                          <div className="text-4xl font-bold mb-2">{step.number}</div>
                          <div className="text-orange-100">Шаг</div>
                        </div>
                      </div>

                      {/* Step Content */}
                      <div className="md:w-2/3 p-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          {step.title}
                        </h3>
                        <p className="text-lg text-gray-600 mb-4">
                          {step.description}
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700">
                            {step.details}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">
                  Готовы начать зарабатывать с LogistGo.pro?
                </h2>
                <p className="text-xl text-orange-100 mb-8">
                  Следуйте этим шагам и уже через несколько дней получите первые заказы
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={handleRegister}
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Начать регистрацию
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

          {/* Additional Info */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Telegram бот</h3>
                <p className="text-gray-600 text-sm">
                  Работайте с LogistGo.pro в любом месте через <a href="https://t.me/logistgoBot" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Telegram бот</a>
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <Globe className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Международные перевозки</h3>
                <p className="text-gray-600 text-sm">
                  Работайте с грузовладельцами из Беларуси, России, Казахстана, Польши, Литвы
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardContent className="p-0">
                <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Бесплатно</h3>
                <p className="text-gray-600 text-sm">
                  Регистрация и основные функции LogistGo.pro полностью бесплатны
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LandingLayout>
    </>
  );
}
