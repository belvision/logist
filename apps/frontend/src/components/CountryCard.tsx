import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface CountryCardProps {
  flag: string;
  nameRu: string;
  nameLocal?: string;
  slug: string;
  description: string;
}

export function CountryCard({ flag, nameRu, nameLocal, slug, description }: CountryCardProps) {
  return (
    <Link href={`/countries/${slug}`}>
      <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Флаг */}
            <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
              {flag}
            </div>
            
            {/* Название */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {nameRu}
              </h3>
              {nameLocal && (
                <p className="text-sm text-gray-500">{nameLocal}</p>
              )}
            </div>
            
            {/* Описание */}
            <p className="text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
            
            {/* Кнопка */}
            <div className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
              <span>Подробнее</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

