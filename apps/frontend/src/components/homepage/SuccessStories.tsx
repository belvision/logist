'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  TrendingUp, 
  Clock, 
  DollarSign,
  MapPin,
  Truck,
  Package,
  Users
} from 'lucide-react';

interface SuccessStory {
  id: number;
  company: string;
  route: string;
  savings: string;
  timeSaved: string;
  rating: number;
  description: string;
  category: 'time' | 'money' | 'efficiency';
}

const successStories: SuccessStory[] = [
  {
    id: 1,
    company: 'ООО "ТрансЛогистик"',
    route: 'Минск → Москва',
    savings: '15,000 руб.',
    timeSaved: '2 дня',
    rating: 5,
    description: 'Нашли попутный груз, который покрыл 80% расходов на топливо. Экономия составила 15,000 рублей.',
    category: 'money'
  },
  {
    id: 2,
    company: 'ИП Иванов А.А.',
    route: 'СПб → Минск',
    savings: '8,500 руб.',
    timeSaved: '1 день',
    rating: 5,
    description: 'Благодаря LogistGo.pro загрузили машину на обратном пути. Получили дополнительную прибыль.',
    category: 'efficiency'
  },
  {
    id: 3,
    company: 'ООО "Быстрая доставка"',
    route: 'Москва → Казань',
    savings: '12,000 руб.',
    timeSaved: '1.5 дня',
    rating: 5,
    description: 'Нашли груз, который идеально подошел по маршруту. Сократили холостые пробеги на 60%.',
    category: 'time'
  }
];

const categoryConfig = {
  money: {
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Экономия'
  },
  time: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Время'
  },
  efficiency: {
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Эффективность'
  }
};

export function SuccessStories() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Успешные кейсы
          </h2>
          <p className="text-xl text-gray-600">
            Реальные истории наших пользователей
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {successStories.map((story) => {
            const config = categoryConfig[story.category];
            const Icon = config.icon;
            
            return (
              <Card key={story.id} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <CardHeader className={`${config.bgColor} ${config.borderColor} border-b`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      <Badge variant="outline" className={`${config.borderColor} ${config.color}`}>
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(story.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{story.company}</CardTitle>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">{story.route}</span>
                    </div>
                    
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {story.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-600">Экономия</span>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {story.savings}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-600">Время</span>
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {story.timeSaved}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Общая статистика успеха */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">
                  Общая статистика успеха
                </h3>
                <p className="text-green-100">
                  Наши пользователи экономят время и деньги каждый день
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="h-6 w-6" />
                    <span className="text-lg font-semibold">Средняя экономия</span>
                  </div>
                  <div className="text-3xl font-bold">12,500 руб.</div>
                  <div className="text-green-200 text-sm">на одну перевозку</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-6 w-6" />
                    <span className="text-lg font-semibold">Экономия времени</span>
                  </div>
                  <div className="text-3xl font-bold">1.5 дня</div>
                  <div className="text-green-200 text-sm">в среднем</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="h-6 w-6" />
                    <span className="text-lg font-semibold">Довольных клиентов</span>
                  </div>
                  <div className="text-3xl font-bold">95%</div>
                  <div className="text-green-200 text-sm">рекомендуют нас</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
