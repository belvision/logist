'use client';

import { LandingLayout } from "@/components/layout/LandingLayout";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Truck, 
  Package, 
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
  Smartphone,
  DollarSign,
  TrendingUp,
  Eye
} from "lucide-react";

export default function CarriersPage() {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/registry');
  };

  return (
    <>
      <Head>
        <title>Для перевозчиков - LogistGo.pro | Быстрый поиск грузов в Беларуси</title>
        <meta name="description" content="Быстрый поиск грузов для перевозчиков на LogistGo.pro. Добавьте транспорт бесплатно и получайте заказы от грузовладельцев. Международные перевозки по Беларуси, России, Казахстану, Польше, Литве." />
        <meta name="keywords" content="поиск грузов, перевозчики, грузоперевозки, Беларусь, Россия, Казахстан, Польша, Литва, логистика, транспорт, заказы" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://logistgo.pro/carriers" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Для перевозчиков - LogistGo.pro | Быстрый поиск грузов" />
        <meta property="og:description" content="Добавьте транспорт бесплатно и получайте заказы от грузовладельцев. Международные перевозки." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://logistgo.pro/carriers" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
            })
          }}
        />
      </Head>
      <LandingLayout>
        <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-800 to-red-900 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">

                <span className="text-orange-300">Поиск грузов</span>
                <br />
                <span className="text-yellow-400">для перевозчиков</span>
              </h1>
              <p className="text-xl md:text-2xl text-orange-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                Зарегистрируйтесь на международной Бирже грузоперевозок LogistGo.pro и найдите подходящие грузы для вашего транспорта
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
              <p className="text-orange-200 text-xl font-semibold mb-4">из социальных сетей и тендерных сайтов</p>
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
        </section>

        {/* Main Actions Section */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Добавьте транспорт, и заказчики сами найдут вас</h2>
              <p className="text-xl text-gray-600 mb-8">Добавьте машину на LogistGo.pro — это бесплатно и займёт не более 5 минут</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Truck className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Участники из Беларуси и других стран</h3>
                    <p className="text-gray-600 text-sm">
                      Дождитесь откликов — участники LogistGo.pro регулярно ищут транспорт на Бирже
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Международные перевозки</h3>
                    <p className="text-gray-600 text-sm">
                      Каждый день работают на LogistGo.pro, чтобы организовать перевозку грузов по Беларуси, России, Казахстану, Польше, Литве
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <ArrowRight className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Быстрая регистрация</h3>
                    <p className="text-gray-600 text-sm">
                      Чтобы добавить транспорт — пройдите быструю регистрацию
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button 
                onClick={handleRegister}
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Зарегистрироваться
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Convenience Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">LogistGo.pro экономит время перевозчиков</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Работайте там, где удобно</h3>
                    <p className="text-gray-600">
                      <a href="https://t.me/logistgoBot" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Telegram бот</a> позволит находить грузы, даже если вы в пути и у вас нет под рукой компьютера.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Не нужно ничего заполнять вручную</h3>
                    <p className="text-gray-600">
                      Достаточно один раз добавить на LogistGo.pro реквизиты, сканы документов и другие данные. При дальнейшей работе они подтянутся автоматически.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Можно формировать электронные документы</h3>
                    <p className="text-gray-600">
                      Сервис позволяет в несколько кликов создать документ из шаблона или загрузить свой образец, подтянув в него ранее внесённые реквизиты машины, водителя и т. д.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Safety Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Инструменты для безопасной работы перевозчиков</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <Shield className="h-8 w-8 text-green-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">Паспорт участника LogistGo.pro</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Отражает репутацию участника, показывает, вовремя ли он платит, и помогает не связаться с неплательщиками.
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <Map className="h-8 w-8 text-blue-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">Бесплатный GPS-мониторинг транспорта</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Показывает на карте, где прямо сейчас находится транспорт и статус перевозки. Ссылкой на отслеживание можно поделиться с заказчиком.
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
                    Помогает найти лучших участников из вашей страны или региона.
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    <MessageCircle className="h-8 w-8 text-purple-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">Мессенджер LogistGo.pro</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Помогает обсудить детали заказа и гарантирует безопасное общение с участниками.
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
                    Помогают убедиться, что грузоотправитель платёжеспособен, не имеет долгов и проблем с законом.
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
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Электронные документы</h3>
                    <p className="text-gray-600">
                      Создавайте и обменивайтесь документами в электронном виде, экономьте время на бумажной работе.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Аналитика и отчеты</h3>
                    <p className="text-gray-600">
                      Отслеживайте свою работу, анализируйте доходы и оптимизируйте маршруты.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Smartphone className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Мобильное приложение</h3>
                    <p className="text-gray-600">
                      Работайте с LogistGo.pro в любом месте через мобильное приложение.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How to Start Section */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Как начать работать на LogistGo.pro</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">7 шагов для начала успешной работы на LogistGo.pro</h3>
                    <p className="text-gray-600 mb-6">
                      Как перевозчику начать работать на LogistGo.pro, чтобы получать грузы.
                    </p>
                    <Button 
                      onClick={() => router.push('/carriers/7-steps')}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-lg"
                    >
                      ПОДРОБНЕЕ
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Как добавить транспорт</h3>
                    <p className="text-gray-600 mb-6">
                      Как добавить ваш автомобиль, чтобы получать предложения от грузовладельцев.
                    </p>
                    <Button 
                      onClick={() => router.push('/carriers/add-transport')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg"
                    >
                      ПОДРОБНЕЕ
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Зачем нужны лицензии</h3>
                    <p className="text-gray-600 mb-6">
                      Что на LogistGo.pro доступно бесплатно, а для чего нужно покупать лицензию.
                    </p>
                    <Button 
                      onClick={() => router.push('/carriers/licenses')}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg"
                    >
                      ПОДРОБНЕЕ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Free Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              Зарегистрируйтесь и вы сможете бесплатно:
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Eye className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Видеть контакты в грузах</h3>
                    <p className="text-gray-600">
                      По Беларуси, России, Казахстану, Польше, Литве
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Truck className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Добавлять ваши машины</h3>
                    <p className="text-gray-600">
                      И получать предложения от грузоотправителей
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button 
              onClick={handleRegister}
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Truck className="mr-2 h-5 w-5" />
              Присоединяйтесь к LogistGo.pro — это бесплатно
            </Button>
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