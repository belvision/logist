'use client';

import { LandingLayout } from "@/components/layout/LandingLayout";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft,
  Truck,
  FileText,
  Camera,
  MapPin,
  Clock,
  CheckCircle,
  Info
} from "lucide-react";

export default function AddTransportPage() {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/registry');
  };

  const steps = [
    {
      title: "Основная информация о транспорте",
      items: [
        "Тип транспортного средства (грузовик, фура, прицеп и т.д.)",
        "Марка и модель автомобиля",
        "Год выпуска",
        "Государственный номер",
        "VIN-номер"
      ]
    },
    {
      title: "Технические характеристики",
      items: [
        "Грузоподъемность (в тоннах)",
        "Объем кузова (в куб. метрах)",
        "Габариты (длина, ширина, высота)",
        "Тип кузова (тент, рефрижератор, открытый и т.д.)",
        "Количество осей"
      ]
    },
    {
      title: "Документы на транспорт",
      items: [
        "Свидетельство о регистрации ТС",
        "Страховой полис ОСАГО",
        "Техпаспорт",
        "Лицензия на перевозку (если требуется)",
        "Документы на прицеп (если есть)"
      ]
    },
    {
      title: "Информация о водителе",
      items: [
        "Водительское удостоверение",
        "Медицинская справка",
        "Трудовая книжка или договор",
        "Справка о несудимости (для международных перевозок)",
        "Фотография водителя"
      ]
    },
    {
      title: "Маршруты и направления",
      items: [
        "Предпочитаемые направления перевозок",
        "Регионы работы",
        "График работы",
        "Стоимость за километр",
        "Дополнительные услуги"
      ]
    }
  ];

  const tips = [
    {
      icon: CheckCircle,
      title: "Проверьте все данные",
      description: "Убедитесь, что вся информация указана корректно и соответствует документам"
    },
    {
      icon: Camera,
      title: "Качественные фото",
      description: "Загрузите четкие фотографии транспорта с разных ракурсов"
    },
    {
      icon: FileText,
      title: "Актуальные документы",
      description: "Все документы должны быть действительными и не просроченными"
    },
    {
      icon: MapPin,
      title: "Укажите регионы работы",
      description: "Это поможет грузовладельцам быстрее найти ваш транспорт"
    }
  ];

  return (
    <>
      <Head>
        <title>Как добавить транспорт на LogistGo.pro | Инструкция для перевозчиков</title>
        <meta name="description" content="Подробная инструкция: как добавить транспорт на LogistGo.pro за 5 минут. Какие документы нужны, как заполнить профиль, получить первые заказы от грузовладельцев." />
        <meta name="keywords" content="добавить транспорт, регистрация перевозчика, документы на транспорт, LogistGo.pro, грузоперевозки, Беларусь, Россия, Казахстан" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://logistgo.pro/carriers/add-transport" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Как добавить транспорт на LogistGo.pro" />
        <meta property="og:description" content="Подробная инструкция: как добавить транспорт за 5 минут и получить первые заказы." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://logistgo.pro/carriers/add-transport" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HowTo",
              "name": "Как добавить транспорт на LogistGo.pro",
              "description": "Инструкция для перевозчиков по добавлению транспорта",
              "url": "https://logistgo.pro/carriers/add-transport",
              "totalTime": "PT5M",
              "supply": [
                {
                  "@type": "HowToSupply",
                  "name": "Документы на транспорт"
                },
                {
                  "@type": "HowToSupply",
                  "name": "Документы водителя"
                }
              ],
              "step": steps.map((step, index) => ({
                "@type": "HowToStep",
                "position": index + 1,
                "name": step.title,
                "text": step.items.join(", ")
              }))
            })
          }}
        />
      </Head>
      <LandingLayout>
        <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-800 to-red-900 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Navigation */}
            <div className="flex items-center justify-between mb-12">
              <Button 
                onClick={() => router.back()}
                variant="ghost"
                className="flex items-center gap-2 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
              <Button 
                onClick={handleRegister}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                Зарегистрироваться
              </Button>
            </div>

            {/* Hero Content */}
            <div className="text-center">
              <div className="mb-8">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                  <span className="text-orange-300">Как добавить</span>
                  <br />
                  <span className="text-yellow-400">транспорт</span>
                </h1>
                <p className="text-xl md:text-2xl text-orange-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                  Подробное руководство по добавлению вашего автомобиля для получения предложений от грузовладельцев
                </p>
              </div>

              {/* Quick Info Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Truck className="h-8 w-8 text-yellow-400" />
                  <span className="text-white text-lg font-semibold">Бесплатно и быстро</span>
                </div>
                <p className="text-orange-200 text-sm">
                  Добавление транспорта займёт не более 5 минут
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200 mb-12">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Info className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Важно знать
                  </h3>
                  <p className="text-blue-800">
                    Добавление транспорта на LogistGo.pro занимает не более 5 минут. 
                    После регистрации вы сможете получать уведомления о подходящих грузах 
                    и откликаться на предложения грузовладельцев.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card key={index}>
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {step.title}
                    </h2>
                  </div>
                  
                  <div className="ml-14">
                    <ul className="space-y-3">
                      {step.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tips Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Полезные советы
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {tips.map((tip, index) => {
                const IconComponent = tip.icon;
                return (
                  <Card key={index} className="p-6">
                    <CardContent className="p-0">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {tip.title}
                          </h3>
                          <p className="text-gray-600">
                            {tip.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Process Timeline */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Что происходит после добавления транспорта
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-6 text-center">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Мгновенная активация</h3>
                  <p className="text-gray-600 text-sm">
                    Ваш транспорт сразу становится видимым для грузовладельцев
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 text-center">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Получение уведомлений</h3>
                  <p className="text-gray-600 text-sm">
                    Вы будете получать уведомления о подходящих грузах
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 text-center">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Начало работы</h3>
                  <p className="text-gray-600 text-sm">
                    Откликайтесь на заказы и начинайте зарабатывать
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">
                  Готовы добавить свой транспорт?
                </h2>
                <p className="text-xl text-blue-100 mb-8">
                  Зарегистрируйтесь и начните получать предложения от грузовладельцев уже сегодня
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={handleRegister}
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Добавить транспорт
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
