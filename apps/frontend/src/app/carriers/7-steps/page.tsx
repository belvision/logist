'use client';

import { useTranslation } from 'react-i18next';
import { LandingLayout } from "@/components/layout/LandingLayout";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { backgroundImages } from "@/lib/background-images";
import { useState } from "react";
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
  Globe
} from "lucide-react";

// Компонент для блока с фоновым изображением шага
function StepBackgroundBlock({ stepNumber, children }: { stepNumber: number; children: React.ReactNode }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageUrl = backgroundImages.carriers7Steps.step(stepNumber);
  const useGradient = !imageUrl || imageError;
  const patternSvg = "data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

  return (
    <div 
      className={`md:w-1/3 p-8 text-white relative overflow-hidden bg-cover bg-center bg-no-repeat ${
        useGradient ? 'bg-gradient-to-br from-orange-500 to-orange-600' : ''
      }`}
      style={!useGradient && imageUrl ? {
        backgroundImage: `url('${imageUrl}')`,
      } : undefined}
    >
      {/* Фоновое изображение */}
      {imageUrl && !imageError && (
        <>
          <div
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url('${imageUrl}')`,
            }}
          />
          <img
            src={imageUrl}
            alt=""
            className="hidden"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </>
      )}

      {/* Overlay для читаемости текста - такой же как в BackgroundImage компоненте */}
      {!useGradient && imageLoaded && (
        <>
          <div 
            className="absolute inset-0"
            style={{
              backgroundColor: 'black',
              opacity: 0.4,
            }}
          />
          {/* Паттерн поверх изображения */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url('${patternSvg}')`,
            }}
          />
        </>
      )}

      {/* Контент */}
      <div className="relative z-10 text-center">
        {children}
      </div>
    </div>
  );
}

export default function SevenStepsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleRegister = () => {
    router.push('/registry');
  };

  const icons = [User, Truck, Shield, MessageCircle, Search, Star, FileText];
  
  const steps = icons.map((icon, index) => ({
    number: index + 1,
    title: t(`carriersPages.sevenSteps.steps.${index}.title`),
    description: t(`carriersPages.sevenSteps.steps.${index}.description`),
    icon,
    details: t(`carriersPages.sevenSteps.steps.${index}.details`)
  }));

  // Structured Data для SEO - создаем после определения steps
  const structuredDataSteps = steps.map((step) => ({
    "@type": "HowToStep",
    "position": step.number,
    "name": step.title,
    "text": step.description
  }));

  return (
    <>
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
            "step": structuredDataSteps
          })
        }}
      />
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
            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <Card key={step.number} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="md:flex">
                      {/* Step Number and Icon */}
                      <StepBackgroundBlock stepNumber={step.number}>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                          <IconComponent className="h-8 w-8" />
                        </div>
                        <div className="text-4xl font-bold mb-2">{step.number}</div>
                        <div className="text-orange-100">Шаг</div>
                      </StepBackgroundBlock>

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
                    className="border-2 border-white bg-white/10 text-white hover:bg-white hover:text-orange-600 font-bold text-lg px-8 py-4 rounded-lg transition-all duration-300"
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
