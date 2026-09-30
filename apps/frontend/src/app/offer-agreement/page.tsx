'use client';

import { LandingLayout } from "@/components/layout/LandingLayout";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  Users,
  Truck,
  Package,
  CreditCard,
  Shield,
  Globe,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

export default function OfferAgreementPage() {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/registry');
  };

  return (
    <>
      <Head>
        <title>Договор оферты - LogistGo.pro | Публичная оферта на оказание услуг</title>
        <meta name="description" content="Публичная оферта LogistGo.pro на оказание услуг по организации грузоперевозок. Условия использования платформы, права и обязанности сторон." />
        <meta name="keywords" content="договор оферты, публичная оферта, LogistGo.pro, грузоперевозки, условия использования, Беларусь" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://logistgo.pro/offer-agreement" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Договор оферты - LogistGo.pro" />
        <meta property="og:description" content="Публичная оферта на оказание услуг по организации грузоперевозок" />
        <meta property="og:type" content="website" />
      </Head>
      <LandingLayout>
        <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 overflow-hidden">
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
                  <span className="text-green-300">Договор</span>
                  <br />
                  <span className="text-yellow-400">оферты</span>
                </h1>
                <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                  Публичная оферта на оказание услуг по организации грузоперевозок через платформу LogistGo.pro
                </p>
              </div>

              {/* Quick Info Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <FileText className="h-8 w-8 text-yellow-400" />
                  <span className="text-white text-lg font-semibold">Публичная оферта</span>
                </div>
                <p className="text-green-200 text-sm">
                  Условия использования платформы LogistGo.pro
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">
          
          {/* Introduction */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Общие положения</h2>
                  <p className="text-lg text-gray-600">
                    Настоящий документ является публичной офертой (далее — «Оферта») на оказание услуг 
                    по организации грузоперевозок через платформу LogistGo.pro в соответствии с 
                    Гражданским кодексом Республики Беларусь.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Правовая основа</h3>
                    <p className="text-gray-600 text-sm">
                      Документ составлен в соответствии с законодательством РБ
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Для всех пользователей</h3>
                    <p className="text-gray-600 text-sm">
                      Условия действуют для перевозчиков и грузовладельцев
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Защита интересов</h3>
                    <p className="text-gray-600 text-sm">
                      Обеспечиваем защиту прав всех участников платформы
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Terms and Definitions */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Термины и определения</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 mb-2">Перевозчик</h3>
                          <p className="text-gray-600 text-sm">
                            Физическое или юридическое лицо, предоставляющее услуги по перевозке грузов
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Package className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 mb-2">Грузовладелец</h3>
                          <p className="text-gray-600 text-sm">
                            Физическое или юридическое лицо, имеющее груз для перевозки
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Globe className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 mb-2">Платформа</h3>
                          <p className="text-gray-600 text-sm">
                            Веб-сервис LogistGo.pro для организации грузоперевозок
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <CreditCard className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 mb-2">Услуги</h3>
                          <p className="text-gray-600 text-sm">
                            Комплекс услуг по организации грузоперевозок через платформу
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject of Agreement */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Предмет договора</h2>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Исполнитель обязуется:</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Предоставить доступ к платформе LogistGo.pro</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Обеспечить техническую поддержку пользователей</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Организовать взаимодействие между перевозчиками и грузовладельцами</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Обеспечить безопасность персональных данных</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Предоставить инструменты для управления заявками</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Пользователь обязуется:</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Предоставлять достоверную информацию о себе и своей деятельности</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Соблюдать правила использования платформы</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Не нарушать права других пользователей</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Своевременно оплачивать услуги (при наличии платных функций)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Уведомлять об изменениях в предоставленной информации</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rights and Obligations */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Права и обязанности сторон</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Права пользователя:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Получать услуги в соответствии с условиями договора</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Требовать исправления недостоверных данных</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Получать техническую поддержку</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Расторгнуть договор в любое время</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Права исполнителя:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Требовать соблюдения правил использования</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Приостанавливать доступ при нарушениях</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Взимать плату за дополнительные услуги</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Изменять условия с уведомлением пользователей</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Terms */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Условия оплаты</h2>
                
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-green-800 mb-4">Бесплатные услуги</h3>
                    <ul className="space-y-2 text-green-700">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Регистрация и создание профиля</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Добавление транспорта и грузов</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Поиск и просмотр заявок</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Базовый мессенджер</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>API доступ</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-blue-800 mb-4">Платные услуги</h3>
                    <ul className="space-y-2 text-blue-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>CRM интеграция</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Расширенная аналитика</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Приоритетные уведомления</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Расширенный документооборот</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API and Technical Requirements */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">API и технические требования</h2>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Техническая интеграция:</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Пользователь самостоятельно проводит техническую интеграцию с API</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Интеграция должна соответствовать технической документации API</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Пользователь несет ответственность за работоспособность своего оборудования</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Запрещается вмешиваться в работу API или злоупотреблять доступом</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Ограничения использования:</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Запрещается передавать API-ключи третьим лицам</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Нельзя копировать базу данных или передавать полученную информацию третьим лицам</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Запрещается создавать ложное впечатление о сотрудничестве с LogistGo.pro</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Нельзя использовать API для причинения убытков платформе</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intellectual Property */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Интеллектуальная собственность</h2>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-blue-800 mb-4">Права на базу данных</h3>
                    <ul className="space-y-2 text-blue-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Пользователь получает простую (неисключительную) лицензию на доступ к информации</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Все исключительные права на базу данных принадлежат LogistGo.pro</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Пользователь не получает права на копирование или распространение данных</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-green-800 mb-4">Передача данных пользователя</h3>
                    <ul className="space-y-2 text-green-700">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Пользователь соглашается на добавление своих данных в общую базу</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Данные могут использоваться для анализа и предоставления доступа третьим лицам</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Источник информации может не указываться при предоставлении доступа</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dispute Resolution */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Разрешение споров</h2>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-purple-500 pl-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Претензионный порядок:</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>Споры решаются путем переговоров в первую очередь</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>Претензии рассматриваются в течение 30 календарных дней</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>При невозможности решения спора - обращение в суд</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span>Подсудность: суды Республики Беларусь</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liability */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Ответственность сторон</h2>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-red-500 pl-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Ограничение ответственности:</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>Исполнитель не несет ответственности за качество перевозок</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>Платформа является посредником между сторонами</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>Ответственность за груз несет перевозчик</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>Исполнитель не гарантирует постоянную доступность сервиса</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>Пользователь возмещает убытки при нарушении условий договора</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="mb-16">
            <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-4">Контактная информация</h2>
                  <p className="text-green-100">
                    По всем вопросам, связанным с договором оферты, обращайтесь к нам
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Mail className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold mb-2">Email</h3>
                    <p className="text-green-100 text-sm">5730844@gmail.com</p>
                  </div>

                  <div className="text-center">
                    <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Phone className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold mb-2">Телефон</h3>
                    <p className="text-green-100 text-sm">+375295730844</p>
                  </div>

                  <div className="text-center">
                    <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold mb-2">ИП</h3>
                    <p className="text-green-100 text-sm">Гаев Сергей Викторович</p>
                    <p className="text-green-100 text-xs mt-1">УНП 191711739</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Final Information */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">
                  Присоединяйтесь к LogistGo.pro
                </h2>
                <p className="text-xl text-blue-100 mb-8">
                  Регистрируясь на платформе, вы автоматически принимаете условия данного договора оферты
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={handleRegister}
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Принять условия и зарегистрироваться
                  </Button>
                  <Button 
                    onClick={() => router.push('/privacy-policy')}
                    size="lg"
                    variant="outline"
                    className="border-2 border-white bg-white/10 text-white hover:bg-white hover:text-blue-600 font-bold text-lg px-8 py-4 rounded-lg transition-all duration-300"
                  >
                    Политика конфиденциальности
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
