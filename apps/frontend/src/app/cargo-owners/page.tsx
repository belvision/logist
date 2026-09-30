'use client';

import { LandingLayout } from "@/components/layout/LandingLayout";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, 
  Truck, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  MapPin,
  FileText,
  Bot,
  Users,
  Globe,
  Phone,
  Mail,
  Award,
  MessageCircle,
  Instagram,
  Facebook,
  Zap,
  Heart,
  Star,
  Search,
  Clock,
  ShieldCheck,
  Map,
  BarChart3,
  Smartphone
} from "lucide-react";

export default function CargoOwnersPage() {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/registry');
  };

  return (
    <>
      <Head>
        <title>Для грузовладельцев - LogistGo.pro | Быстрый поиск перевозчиков в Беларуси</title>
        <meta name="description" content="Быстрый поиск перевозчиков в Беларуси на LogistGo.pro. Добавьте груз бесплатно и найдите надежного перевозчика за 5 минут. Международные перевозки по Беларуси, России, Казахстану, Польше, Литве." />
        <meta name="keywords" content="поиск перевозчиков, грузовладельцы, перевозка грузов, Беларусь, Россия, Казахстан, Польша, Литва, логистика, грузы, транспорт" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://logistgo.pro/cargo-owners" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Для грузовладельцев - LogistGo.pro | Быстрый поиск перевозчиков" />
        <meta property="og:description" content="Добавьте груз бесплатно и найдите надежного перевозчика за 5 минут. Международные перевозки." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://logistgo.pro/cargo-owners" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Для грузовладельцев - LogistGo.pro",
              "description": "Быстрый поиск перевозчиков в Беларуси",
              "url": "https://logistgo.pro/cargo-owners",
              "mainEntity": {
                "@type": "Service",
                "name": "Поиск перевозчиков",
                "description": "Сервис поиска перевозчиков для грузовладельцев",
                "provider": {
                  "@type": "Organization",
                  "name": "LogistGo.pro"
                }
              }
            })
          }}
        />
      </Head>
      <LandingLayout>
        <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Быстрый поиск
                <br />
                <span className="text-green-300">перевозчиков</span>

              </h1>
              <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                Зарегистрируйтесь на международной Бирже грузоперевозок LogistGo.pro и вы сможете бесплатно добавить груз и найти перевозчика
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                onClick={handleRegister}
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-4 rounded-lg shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300"
              >
                Зарегистрироваться
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Contact Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-white text-lg mb-2">База грузоперевозчиков и грузоотправителей</p>
              <p className="text-green-200 text-xl font-semibold mb-4">из социальных сетей и тендерных сайтов</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-green-100">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-300" />
                  <span className="text-sm">Telegram</span>
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-300" />
                  <span className="text-sm">Instagram</span>
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-green-300" />
                  <span className="text-sm">ВКонтакте</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Actions Section */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Add Cargo */}
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Package className="h-16 w-16 text-green-600 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Добавить груз бесплатно</h3>
                    <p className="text-gray-600 mb-6">
                      Его увидят перевозчики и экспедиторы. Груз с хорошей ставкой забирают быстро.
                    </p>
                    <Button 
                      onClick={handleRegister}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg"
                    >
                      Добавить
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Find Carrier */}
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Search className="h-16 w-16 text-blue-600 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Найти перевозчика</h3>
                    <p className="text-gray-600 mb-6">
                      На LogistGo.pro ежедневно свободно множество машин. Найдите подходящую самостоятельно за несколько минут.
                    </p>
                    <Button 
                      onClick={handleRegister}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg"
                    >
                      Найти
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Safety Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Инструменты для безопасной работы</h2>
              <p className="text-xl text-gray-600">Помогают защитить грузы и не связаться с мошенниками</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <Shield className="h-8 w-8 text-green-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">Паспорт участника LogistGo.pro</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    отражает репутацию участника и его добросовестность
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <Star className="h-8 w-8 text-yellow-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">Рейтинг участников LogistGo.pro</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    позволяет найти лучших перевозчиков или экспедиторов в Беларуси, России, Казахстане, Польше, Литве
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <MessageCircle className="h-8 w-8 text-blue-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">Мессенджер LogistGo.pro</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    помогает обсудить детали заказа и гарантирует безопасное общение с участниками
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <Map className="h-8 w-8 text-purple-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">GPS-мониторинг</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    показывает грузы на карте в режиме онлайн, защищает от кражи и угона
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <ShieldCheck className="h-8 w-8 text-red-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">Проверки LogistGo.pro</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    помогают убедиться, что перевозчик не мошенник, не должник и отражают другие риски
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Additional Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Бесплатный электронный документооборот</h3>
                    <p className="text-gray-600">
                      Сервис позволяет в несколько кликов создать документ из шаблона или загрузить свой образец, подтянув в него ранее внесенные реквизиты машины, водителя и т. д.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Отчёты и аналитика</h3>
                    <p className="text-gray-600">
                      Все действия можно отслеживать, а затем анализировать с помощью отчётов. Вы будете знать, кто, по какой цене и куда возил грузы. Это позволит оптимизировать логистику.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Telegram бот</h3>
                    <p className="text-gray-600">
                      Вам не нужно иметь под рукой компьютер. <a href="https://t.me/logistgoBot" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Telegram бот</a> позволит работать с LogistGo.pro везде, где угодно.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Организуйте всю грузоперевозку на LogistGo.pro — от поиска перевозчика до обмена документами
            </h2>
            <p className="text-xl text-green-100 mb-8">
              LogistGo.pro объединяет перевозчиков из Беларуси, России, Казахстана, Польши, Литвы — заменяет десятки сайтов, мессенджеров и телефонных звонков
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleRegister}
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Package className="mr-2 h-5 w-5" />
                Присоединяйтесь к международной Бирже грузоперевозок LogistGo.pro — это бесплатно
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">LogistGo.pro</h3>
              <p className="text-gray-400 mb-6">
                База грузоперевозчиков и грузоотправителей из социальных сетей и тендерных сайтов
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-gray-300">
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
            </div>
          </div>
        </footer>
      </div>
    </LandingLayout>
    </>
  );
}