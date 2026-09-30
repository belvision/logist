'use client';

import { LandingLayout } from "@/components/layout/LandingLayout";
import Head from "next/head";
import { FAQ, commonFAQs } from "@/components/seo/FAQ";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Truck, 
  Package, 
  Shield, 
  Star, 
  MapPin, 
  FileText, 
  Bot, 
  Users, 
  CheckCircle, 
  Globe,
  Phone,
  Mail,
  ArrowRight,
  Zap,
  Heart,
  Award,
  MessageCircle,
  Instagram,
  Facebook
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/registry');
  };

  const handleCargoOwners = () => {
    // Переход на лендинг для грузовладельцев
    router.push('/cargo-owners');
  };

  const handleCarriers = () => {
    // Переход на лендинг для перевозчиков
    router.push('/carriers');
  };

  return (
    <>
      <Head>
        <title>LogistGo.pro - Международная биржа грузоперевозок | Беларусь, Россия, Казахстан, Польша, Литва</title>
        <meta name="description" content="Международная биржа грузоперевозок LogistGo.pro. Помогает перевозчикам и грузоотправителям из Беларуси, России, Казахстана, Польши, Литвы найти друг друга и договориться о перевозке. Бесплатная регистрация." />
        <meta name="keywords" content="грузоперевозки, биржа грузоперевозок, перевозчики, грузоотправители, Беларусь, Россия, Казахстан, Польша, Литва, логистика, транспорт, грузы" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://logistgo.pro" />
        
        {/* Open Graph */}
        <meta property="og:title" content="LogistGo.pro - Международная биржа грузоперевозок" />
        <meta property="og:description" content="Помогает перевозчикам и грузоотправителям найти друг друга и договориться о перевозке. Бесплатная регистрация." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://logistgo.pro" />
        <meta property="og:site_name" content="LogistGo.pro" />
        <meta property="og:locale" content="ru_RU" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LogistGo.pro - Международная биржа грузоперевозок" />
        <meta name="twitter:description" content="Помогает перевозчикам и грузоотправителям найти друг друга и договориться о перевозке." />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
            })
          }}
        />
      </Head>
      <LandingLayout>
        <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
          
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Международная
                <br />
                <span className="text-blue-300">Биржа грузоперевозок</span>
                <br />
                <span className="text-yellow-400">LogistGo.pro</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                Помогает перевозчикам и грузоотправителям из Беларуси, России, Казахстана, 
                Польши, Литвы найти друг друга и договориться о перевозке
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
              <p className="text-blue-200 text-xl font-semibold mb-4">из социальных сетей и тендерных сайтов</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-blue-100">
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
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <Package className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">База грузов</h3>
                  <p className="text-gray-600">ждут откликов от перевозчиков</p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <Truck className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">База машин</h3>
                  <p className="text-gray-600">готовы к перевозке прямо сейчас</p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <Users className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Тысячи участников</h3>
                  <p className="text-gray-600">ежедневно работают на LogistGo.pro</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Почему выбирают LogistGo.pro</h2>
              <p className="text-xl text-gray-600">Надежная платформа для грузоперевозок</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Безопасно */}
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-6">
                    <Shield className="h-12 w-12 text-green-600 mr-4" />
                    <h3 className="text-2xl font-bold text-gray-900">Безопасно</h3>
                  </div>
                  <ul className="space-y-4 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Паспорт участника LogistGo.pro отражает его репутацию и показывает, можно ли ему доверять</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Рейтинг участников LogistGo.pro помогает найти лучших в вашей стране или регионе</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>В проекте бесплатный GPS-мониторинг грузов и транспорта в реальном времени</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Проверка организации через налоговую</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Удобно */}
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-6">
                    <Zap className="h-12 w-12 text-blue-600 mr-4" />
                    <h3 className="text-2xl font-bold text-gray-900">Удобно</h3>
                  </div>
                  <ul className="space-y-4 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Telegram бот с основными функциями</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>В проекте возможность формировать электронные документы и обмениваться ими</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Не нужно вводить данные вручную — достаточно внести их один раз</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Бесплатно */}
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-6">
                    <Heart className="h-12 w-12 text-red-600 mr-4" />
                    <h3 className="text-2xl font-bold text-gray-900">Бесплатно</h3>
                  </div>
                  <ul className="space-y-4 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Регистрация</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Добавление грузов и транспорта</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Поиск грузов и транспорта</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Оперативная Техподдержка</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>Группа в телеграмме для участников</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Находите надёжных партнёров на LogistGo.pro
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Присоединяйтесь к тысячам участников, которые уже работают на нашей платформе
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleCargoOwners}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Package className="mr-2 h-5 w-5" />
                Для грузовладельцев
              </Button>
              <Button 
                onClick={handleCarriers}
                size="lg"
                className="bg-yellow-500 text-black hover:bg-yellow-600 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Truck className="mr-2 h-5 w-5" />
                Для перевозчиков
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
                Представитель LogistGo.pro в Беларуси Сергей Гаев
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-gray-300">
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
            </div>
          </div>
        </footer>
      </div>
      <FAQ faqs={commonFAQs} />
    </LandingLayout>
    </>
  );
}
