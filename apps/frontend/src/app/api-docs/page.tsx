'use client';

import { LandingLayout } from "@/components/layout/LandingLayout";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft,
  Code,
  Users,
  Truck,
  Package,
  MessageCircle,
  FileText,
  Shield,
  Globe,
  Zap,
  CheckCircle
} from "lucide-react";

export default function ApiDocsPage() {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/registry');
  };

  const apiEndpoints = [
    {
      category: "Аутентификация",
      icon: Shield,
      endpoints: [
        {
          method: "POST",
          path: "/api/auth/login",
          description: "Вход в систему",
          parameters: ["email", "password"]
        },
        {
          method: "POST", 
          path: "/api/auth/register",
          description: "Регистрация нового пользователя",
          parameters: ["email", "password", "name", "company_name"]
        },
        {
          method: "POST",
          path: "/api/auth/refresh",
          description: "Обновление токена доступа",
          parameters: ["refresh_token"]
        },
        {
          method: "POST",
          path: "/api/auth/logout",
          description: "Выход из системы",
          parameters: []
        }
      ]
    },
    {
      category: "Пользователи",
      icon: Users,
      endpoints: [
        {
          method: "GET",
          path: "/api/user/me",
          description: "Получение информации о текущем пользователе",
          parameters: []
        },
        {
          method: "PUT",
          path: "/api/user/me",
          description: "Обновление профиля пользователя",
          parameters: ["name", "phone", "company_name"]
        },
        {
          method: "POST",
          path: "/api/user/me/avatar",
          description: "Загрузка аватара пользователя",
          parameters: ["avatar (file)"]
        }
      ]
    },
    {
      category: "Транспорт",
      icon: Truck,
      endpoints: [
        {
          method: "GET",
          path: "/api/transport",
          description: "Получение списка транспорта компании",
          parameters: ["page", "limit"]
        },
        {
          method: "POST",
          path: "/api/transport",
          description: "Добавление нового транспорта",
          parameters: ["type", "brand", "model", "capacity", "volume"]
        },
        {
          method: "GET",
          path: "/api/transport/{id}",
          description: "Получение информации о транспорте",
          parameters: ["id"]
        },
        {
          method: "PUT",
          path: "/api/transport/{id}",
          description: "Обновление информации о транспорте",
          parameters: ["id", "type", "brand", "model", "capacity", "volume"]
        },
        {
          method: "DELETE",
          path: "/api/transport/{id}",
          description: "Удаление транспорта",
          parameters: ["id"]
        }
      ]
    },
    {
      category: "Грузы",
      icon: Package,
      endpoints: [
        {
          method: "GET",
          path: "/api/cargo",
          description: "Поиск грузов",
          parameters: ["from", "to", "weight", "volume", "date_from", "date_to"]
        },
        {
          method: "POST",
          path: "/api/cargo",
          description: "Создание нового груза",
          parameters: ["from", "to", "weight", "volume", "description", "date_from", "date_to"]
        },
        {
          method: "GET",
          path: "/api/cargo/{id}",
          description: "Получение информации о грузе",
          parameters: ["id"]
        },
        {
          method: "PUT",
          path: "/api/cargo/{id}",
          description: "Обновление информации о грузе",
          parameters: ["id", "from", "to", "weight", "volume", "description"]
        },
        {
          method: "DELETE",
          path: "/api/cargo/{id}",
          description: "Удаление груза",
          parameters: ["id"]
        }
      ]
    },
    {
      category: "Заявки и отклики",
      icon: MessageCircle,
      endpoints: [
        {
          method: "POST",
          path: "/api/orders/respond",
          description: "Отклик на груз",
          parameters: ["cargo_id", "transport_id", "price", "comment"]
        },
        {
          method: "GET",
          path: "/api/orders/responses",
          description: "Получение откликов на грузы компании",
          parameters: ["page", "limit"]
        },
        {
          method: "GET",
          path: "/api/orders/my-responses",
          description: "Получение моих откликов",
          parameters: ["page", "limit"]
        },
        {
          method: "PUT",
          path: "/api/orders/response/{id}/accept",
          description: "Принятие отклика",
          parameters: ["id"]
        },
        {
          method: "PUT",
          path: "/api/orders/response/{id}/reject",
          description: "Отклонение отклика",
          parameters: ["id"]
        }
      ]
    },
    {
      category: "Мессенджер",
      icon: MessageCircle,
      endpoints: [
        {
          method: "GET",
          path: "/api/messenger/conversations",
          description: "Получение списка бесед",
          parameters: ["page", "limit"]
        },
        {
          method: "GET",
          path: "/api/messenger/conversations/{id}/messages",
          description: "Получение сообщений беседы",
          parameters: ["id", "page", "limit"]
        },
        {
          method: "POST",
          path: "/api/messenger/conversations/{id}/messages",
          description: "Отправка сообщения",
          parameters: ["id", "content", "type"]
        },
        {
          method: "GET",
          path: "/api/messenger/stats",
          description: "Получение статистики мессенджера",
          parameters: []
        }
      ]
    },
    {
      category: "Документы",
      icon: FileText,
      endpoints: [
        {
          method: "GET",
          path: "/api/documents",
          description: "Получение списка документов",
          parameters: ["page", "limit", "type", "status"]
        },
        {
          method: "POST",
          path: "/api/documents",
          description: "Создание нового документа",
          parameters: ["type", "title", "content", "recipient_id"]
        },
        {
          method: "GET",
          path: "/api/documents/{id}",
          description: "Получение документа",
          parameters: ["id"]
        },
        {
          method: "PUT",
          path: "/api/documents/{id}",
          description: "Обновление документа",
          parameters: ["id", "title", "content"]
        },
        {
          method: "DELETE",
          path: "/api/documents/{id}",
          description: "Удаление документа",
          parameters: ["id"]
        }
      ]
    },
    {
      category: "Компании",
      icon: Globe,
      endpoints: [
        {
          method: "GET",
          path: "/api/companies",
          description: "Получение списка компаний",
          parameters: ["page", "limit", "search"]
        },
        {
          method: "GET",
          path: "/api/companies/{id}",
          description: "Получение информации о компании",
          parameters: ["id"]
        },
        {
          method: "PUT",
          path: "/api/companies/{id}",
          description: "Обновление информации о компании",
          parameters: ["id", "name", "description", "address"]
        }
      ]
    }
  ];

  return (
    <>
      <Head>
        <title>API Документация - LogistGo.pro | Документация для разработчиков</title>
        <meta name="description" content="Полная документация API LogistGo.pro для интеграции с логистическими системами. Аутентификация, управление транспортом, грузами, заявками и мессенджером." />
        <meta name="keywords" content="API документация, LogistGo.pro, интеграция, разработчики, логистика, грузоперевозки, REST API" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://logistgo.pro/api-docs" />
        
        {/* Open Graph */}
        <meta property="og:title" content="API Документация - LogistGo.pro" />
        <meta property="og:description" content="Полная документация API для интеграции с логистическими системами" />
        <meta property="og:type" content="website" />
      </Head>
      <LandingLayout>
        <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 overflow-hidden">
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
                  <span className="text-purple-300">API</span>
                  <br />
                  <span className="text-yellow-400">Документация</span>
                </h1>
                <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                  Полная документация API LogistGo.pro для интеграции с вашими логистическими системами
                </p>
              </div>

              {/* Quick Info Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Code className="h-8 w-8 text-yellow-400" />
                  <span className="text-white text-lg font-semibold">REST API</span>
                </div>
                <p className="text-purple-200 text-sm">
                  JSON формат, JWT аутентификация, полная документация
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">
          
          {/* Introduction */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Обзор API</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                LogistGo.pro предоставляет REST API для интеграции с логистическими системами. 
                Все эндпоинты используют JSON формат и JWT аутентификацию.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-6 text-center">
                <CardContent className="p-0">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Бесплатно</h3>
                  <p className="text-gray-600 text-sm">
                    API доступно бесплатно для всех зарегистрированных пользователей
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 text-center">
                <CardContent className="p-0">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Безопасно</h3>
                  <p className="text-gray-600 text-sm">
                    JWT токены, HTTPS, валидация данных и защита от атак
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 text-center">
                <CardContent className="p-0">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Быстро</h3>
                  <p className="text-gray-600 text-sm">
                    Высокая производительность и быстрые ответы API
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Эндпоинты API</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Полный список доступных эндпоинтов для интеграции с LogistGo.pro
              </p>
            </div>

            <div className="space-y-8">
              {apiEndpoints.map((category, categoryIndex) => {
                const IconComponent = category.icon;
                return (
                  <Card key={categoryIndex} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-6 w-6" />
                          <h3 className="text-xl font-bold">{category.category}</h3>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="space-y-4">
                          {category.endpoints.map((endpoint, endpointIndex) => (
                            <div key={endpointIndex} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                    endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {endpoint.method}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                      {endpoint.path}
                                    </code>
                                  </div>
                                  <p className="text-gray-600 text-sm mb-2">
                                    {endpoint.description}
                                  </p>
                                  {endpoint.parameters.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {endpoint.parameters.map((param, paramIndex) => (
                                        <span key={paramIndex} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                          {param}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Authentication Info */}
          <div className="mb-16">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-4">Аутентификация</h2>
                  <p className="text-blue-100">
                    Все API запросы требуют JWT токен в заголовке Authorization
                  </p>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <code className="text-sm">
                    Authorization: Bearer REDACTED_SECRET
                  </code>
                </div>
                
                <div className="text-center">
                  <p className="text-blue-100 text-sm">
                    Получите токен через эндпоинт /api/auth/login
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">
                  Готовы начать интеграцию?
                </h2>
                <p className="text-xl text-green-100 mb-8">
                  Зарегистрируйтесь и получите доступ к API для интеграции с LogistGo.pro
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
                    onClick={() => router.push('/carriers/licenses')}
                    size="lg"
                    variant="outline"
                    className="border-2 border-white bg-white/10 text-white hover:bg-white hover:text-green-600 font-bold text-lg px-8 py-4 rounded-lg transition-all duration-300"
                  >
                    Тарифы и лицензии
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
