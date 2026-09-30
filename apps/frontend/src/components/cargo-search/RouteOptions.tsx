'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface RouteOptionsProps {
  value: {
    avoidMotorwayToll: boolean;
    preferShortest: boolean;
  };
  onChange: (options: { avoidMotorwayToll: boolean; preferShortest: boolean }) => void;
}

export function RouteOptions({ }: RouteOptionsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          Настройки маршрута
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Используйте промежуточные точки для построения оптимального маршрута
        </p>
      </CardContent>
    </Card>
  );
}
