'use client';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Percent } from 'lucide-react';

interface ThresholdBarProps {
  value: number;
  onChange: (value: number) => void;
}

export function ThresholdBar({ value, onChange }: ThresholdBarProps) {
  const quickValues = [10, 25, 50, 75, 90, 100];

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Percent className="h-4 w-4" />
        Минимальный процент совпадения: {value}%
      </Label>
      
      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={([newValue]) => onChange(newValue ?? 0)}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickValues.map((quickValue) => (
          <button
            key={quickValue}
            onClick={() => onChange(quickValue)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              value === quickValue
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {quickValue}%
          </button>
        ))}
      </div>
    </div>
  );
}
