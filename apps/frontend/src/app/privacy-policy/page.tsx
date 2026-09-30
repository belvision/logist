'use client';

import { LandingLayout } from "@/components/layout/LandingLayout";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft,
  Shield,
  Eye,
  Lock,
  User,
  Database,
  Globe,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/registry');
  };

  return (
    <>
      <Head>
        <title>Политика конфиденциальности - LogistGo.pro | Защита персональных данных</title>
        <meta name="description" content="Политика конфиденциальности LogistGo.pro. Информация о сборе, обработке и защите персональных данных пользователей в соответствии с законодательством Республики Беларусь." />
        <meta name="keywords" content="политика конфиденциальности, защита данных, персональные данные, LogistGo.pro, Беларусь, GDPR" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://logistgo.pro/privacy-policy" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Политика конфиденциальности - LogistGo.pro" />
        <meta property="og:description" content="Информация о защите персональных данных пользователей" />
        <meta property="og:type" content="website" />
      </Head>
      <LandingLayout>
        <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
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
                  <span className="text-blue-300">Политика</span>
                  <br />
                  <span className="text-yellow-400">конфиденциальности</span>
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                  Защита персональных данных пользователей LogistGo.pro в соответствии с законодательством Республики Беларусь
                </p>
              </div>

              {/* Quick Info Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Shield className="h-8 w-8 text-yellow-400" />
                  <span className="text-white text-lg font-semibold">Защита данных</span>
                </div>
                <p className="text-blue-200 text-sm">
                  Ваши персональные данные защищены в соответствии с законодательством РБ
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
                    Настоящая Политика конфиденциальности определяет порядок обработки персональных данных пользователей 
                    сервиса LogistGo.pro в соответствии с Законом Республики Беларусь "О защите персональных данных" 
                    от 7 мая 2021 г. № 99-З.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Eye className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Прозрачность</h3>
                    <p className="text-gray-600 text-sm">
                      Мы открыто информируем о сборе и использовании ваших данных
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Безопасность</h3>
                    <p className="text-gray-600 text-sm">
                      Применяем современные методы защиты персональных данных
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Контроль</h3>
                    <p className="text-gray-600 text-sm">
                      Вы имеете полный контроль над своими персональными данными
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Collection */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Сбор и обработка персональных данных</h2>
                
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Какие данные мы собираем:</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Фамилия, имя, отчество</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Адрес электронной почты</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Номер телефона</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Название компании и должность</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Информация о транспорте (для перевозчиков)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Информация о грузах (для грузовладельцев)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>IP-адрес и данные браузера</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Цели обработки данных:</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Предоставление услуг платформы LogistGo.pro</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Связывание перевозчиков и грузовладельцев</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Обработка заявок и откликов</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Обеспечение безопасности и предотвращение мошенничества</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Улучшение качества сервиса</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>Информирование о новых возможностях платформы</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Rights */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Права пользователей</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Database className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Право на доступ</h3>
                        <p className="text-gray-600 text-sm">Получение информации о том, какие ваши данные мы обрабатываем</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Право на исправление</h3>
                        <p className="text-gray-600 text-sm">Исправление неточных или неполных персональных данных</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <Lock className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Право на удаление</h3>
                        <p className="text-gray-600 text-sm">Удаление ваших персональных данных при наличии оснований</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Shield className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Право на ограничение</h3>
                        <p className="text-gray-600 text-sm">Ограничение обработки ваших персональных данных</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cookies */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Использование файлов cookie</h2>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Что такое cookie?</h3>
                    <p className="text-gray-600 mb-4">
                      Файлы cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве 
                      при посещении веб-сайта. Они помогают нам улучшить работу сайта и предоставить вам 
                      персонализированный опыт.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-2">Обязательные cookie</h4>
                      <p className="text-gray-600 text-sm">
                        Необходимы для базовой работы сайта, включая аутентификацию и безопасность
                      </p>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-2">Аналитические cookie</h4>
                      <p className="text-gray-600 text-sm">
                        Помогают нам понять, как пользователи взаимодействуют с сайтом
                      </p>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-2">Функциональные cookie</h4>
                      <p className="text-gray-600 text-sm">
                        Обеспечивают дополнительные функции, такие как запоминание настроек
                      </p>
                    </div>

                    <div className="border border-gray-200 p-4 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-2">Маркетинговые cookie</h4>
                      <p className="text-gray-600 text-sm">
                        Используются для показа релевантной рекламы и отслеживания эффективности
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Protection */}
          <div className="mb-16">
            <Card className="p-8">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Меры по защите данных</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Lock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Шифрование данных</h3>
                          <p className="text-gray-600 text-sm">Все данные передаются по защищенному HTTPS-соединению</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Shield className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Контроль доступа</h3>
                          <p className="text-gray-600 text-sm">Строгий контроль доступа к персональным данным</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Database className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Резервное копирование</h3>
                          <p className="text-gray-600 text-sm">Регулярное создание резервных копий данных</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Eye className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Мониторинг</h3>
                          <p className="text-gray-600 text-sm">Постоянный мониторинг безопасности системы</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="mb-16">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-4">Контактная информация</h2>
                  <p className="text-blue-100">
                    По всем вопросам, связанным с обработкой персональных данных, обращайтесь к нам
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Mail className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold mb-2">Email</h3>
                    <p className="text-blue-100 text-sm">5730844@gmail.com</p>
                  </div>

                  <div className="text-center">
                    <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Phone className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold mb-2">Телефон</h3>
                    <p className="text-blue-100 text-sm">+375295730844</p>
                  </div>

                  <div className="text-center">
                    <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold mb-2">ИП</h3>
                    <p className="text-blue-100 text-sm">Гаев Сергей Викторович</p>
                    <p className="text-blue-100 text-xs mt-1">УНП 191711739</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Final Information */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">
                  Ваши данные в безопасности
                </h2>
                <p className="text-xl text-green-100 mb-8">
                  Мы серьезно относимся к защите ваших персональных данных и соблюдаем все требования 
                  законодательства Республики Беларусь
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={handleRegister}
                    size="lg"
                    className="bg-white text-green-600 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Зарегистрироваться
                  </Button>
                  <Button 
                    onClick={() => router.push('/offer-agreement')}
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 font-bold text-lg px-8 py-4 rounded-lg"
                  >
                    Договор оферты
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
