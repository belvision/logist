'use client';

import { useTranslation } from 'react-i18next';
import { LandingLayout } from "@/components/layout/LandingLayout";
import { useRouter } from "next/navigation";
import { BackgroundImage } from "@/components/landing/BackgroundImage";
import { backgroundImages } from "@/lib/background-images";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Code, 
  ShoppingCart, 
  Bot, 
  Zap, 
  Shield, 
  Target,
  Lightbulb,
  Globe,
  MessageCircle,
  ArrowRight,
  Phone,
  Award,
  TrendingUp,
  Settings,
  Database
} from "lucide-react";
export default function TeamPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleRegister = () => {
    router.push('/registry');
  };

  const teamMembers = [
    {
      name: "Сергей Гаев",
      avatar: "https://io.logistgo.pro/logistic-pro/team/sergey-gaev.jpg"
    },
    {
      name: "Александр Калиновский",
      avatar: "https://io.logistgo.pro/logistic-pro/team/alexander-kalinovsky.JPG"
    },
    {
      name: "Александр Прусенок", 
      avatar: "https://io.logistgo.pro/logistic-pro/team/alexander-prusenok.JPG"
    },
    {
      name: "Павел Нагай",
      avatar: "https://io.logistgo.pro/logistic-pro/team/pavel-nagai.JPG"
    }
  ];

  const competencies = [
    {
      titleKey: "team.competencies.items.retail.title",
      descriptionKey: "team.competencies.items.retail.description",
      icon: ShoppingCart
    },
    {
      titleKey: "team.competencies.items.marketplace.title",
      descriptionKey: "team.competencies.items.marketplace.description",
      icon: TrendingUp
    },
    {
      titleKey: "team.competencies.items.api.title",
      descriptionKey: "team.competencies.items.api.description",
      icon: Database
    },
    {
      titleKey: "team.competencies.items.security.title",
      descriptionKey: "team.competencies.items.security.description",
      icon: Shield
    },
    {
      titleKey: "team.competencies.items.tgBots.title",
      descriptionKey: "team.competencies.items.tgBots.description",
      icon: Bot
    },
    {
      titleKey: "team.competencies.items.aiMarketing.title",
      descriptionKey: "team.competencies.items.aiMarketing.description",
      icon: Zap
    },
    {
      titleKey: "team.competencies.items.tenders.title",
      descriptionKey: "team.competencies.items.tenders.description",
      icon: Award
    },
    {
      titleKey: "team.competencies.items.fullstack.title",
      descriptionKey: "team.competencies.items.fullstack.description",
      icon: Code
    },
    {
      titleKey: "team.competencies.items.devops.title",
      descriptionKey: "team.competencies.items.devops.description",
      icon: Settings
    },
    {
      titleKey: "team.competencies.items.bitrix.title",
      descriptionKey: "team.competencies.items.bitrix.description",
      icon: Globe
    },
    {
      titleKey: "team.competencies.items.1c.title",
      descriptionKey: "team.competencies.items.1c.description",
      icon: Database
    },
    {
      titleKey: "team.competencies.items.parsing.title",
      descriptionKey: "team.competencies.items.parsing.description",
      icon: Zap
    }
  ];

  return (
    <>
      <LandingLayout>
        <div className="min-h-screen">
        {/* Hero Section */}
        <BackgroundImage
          imageUrl={backgroundImages.team.hero}
          gradientClass="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"
          overlayOpacity={0.4}
          showPattern={true}
          className="min-h-screen flex items-center justify-center"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                <span className="text-blue-300">{t('team.hero.title')}</span>
                <br />
                <span className="text-yellow-400">{t('team.hero.brand')}</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                {t('team.hero.subtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                onClick={handleRegister}
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-4 sm:px-8 py-4 rounded-lg shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 w-full sm:w-auto"
              >
                {t('team.hero.joinButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Contact Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-white text-lg mb-2">{t('team.hero.contactUs')}</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-blue-100">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-300" />
                  <span className="text-sm">+375 29 573-08-44</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-300" />
                  <span className="text-sm">@sergeiozon</span>
                </div>
              </div>
            </div>
          </div>
        </BackgroundImage>

        {/* Mission Section */}
        <section className="py-25 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('team.mission.title')}</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                {t('team.mission.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{t('team.mission.goal.title')}</h3>
                    <p className="text-gray-600 text-sm">
                      {t('team.mission.goal.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Lightbulb className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{t('team.mission.vision.title')}</h3>
                    <p className="text-gray-600 text-sm">
                      {t('team.mission.vision.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-center">
                    <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{t('team.mission.values.title')}</h3>
                    <p className="text-gray-600 text-sm">
                      {t('team.mission.values.description')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Members Section */}
        <section className="py-25 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('team.members.title')}</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                {t('team.members.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300 text-center">
                  <CardContent className="p-0">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full rounded-full object-cover border-4 border-blue-100 shadow-lg"
                          onError={(e) => {
                            // Fallback к иконке если фото не загрузилось
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.classList.remove('hidden');
                            }
                          }}
                          onLoad={() => {
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full rounded-full flex items-center justify-center bg-blue-100 border-4 border-blue-100 shadow-lg ${member.avatar ? 'hidden' : ''}`}>
                        <Users className="h-10 w-10 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Competencies Section */}
        <section className="py-25 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('team.competencies.title')}</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                {t('team.competencies.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {competencies.map((competency, index) => {
                const IconComponent = competency.icon;
                return (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-0">
                      <div className="text-center">
                        <IconComponent className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-3">{t(competency.titleKey)}</h3>
                        <p className="text-gray-600 text-sm">{t(competency.descriptionKey)}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-25 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">{t('team.cta.title')}</h2>
            <p className="text-xl text-blue-100 mb-8">
              {t('team.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleRegister}
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-4 rounded-lg shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300"
              >
                {t('team.cta.register')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={() => router.push('/carriers')}
                variant="outline"
                size="lg"
                className="border-2 border-white bg-white/10 text-white hover:bg-white hover:text-blue-600 font-bold text-lg px-8 py-4 rounded-lg transition-all duration-300"
              >
                {t('team.cta.learnMore')}
              </Button>
            </div>
          </div>
        </section>
        </div>
      </LandingLayout>
    </>
  );
}
