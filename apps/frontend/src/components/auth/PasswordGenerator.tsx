'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Copy, RefreshCw, Eye, EyeOff, Check } from 'lucide-react';

interface PasswordGeneratorProps {
  onPasswordSelect?: (password: string) => void;
  className?: string;
}

interface GeneratedPassword {
  password: string;
  strength: string;
  score: number;
}

export function PasswordGenerator({ onPasswordSelect, className }: PasswordGeneratorProps) {
  const [passwords, setPasswords] = useState<GeneratedPassword[]>([]);
  const [loading, setLoading] = useState(false);
  const [length, setLength] = useState(16);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());

  const generatePasswords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/generate-password?count=${count}&length=${length}`);
      const data = await response.json();
      
      if (response.ok) {
        // Проверяем силу каждого пароля
        const passwordsWithStrength = await Promise.all(
          data.passwords.map(async (password: string) => {
            const strengthResponse = await fetch('/api/auth/check-password-strength', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password })
            });
            const strengthData = await strengthResponse.json();
            
            return {
              password,
              strength: strengthData.strengthLabel || 'Неизвестно',
              score: strengthData.score || 0
            };
          })
        );
        
        setPasswords(passwordsWithStrength);
      } else {
        console.error('Ошибка генерации паролей:', data.error);
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
    }
  }, [count, length]);

  const copyToClipboard = async (password: string, index: number) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Ошибка копирования:', error);
    }
  };

  const togglePasswordVisibility = (index: number) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(index)) {
      newVisible.delete(index);
    } else {
      newVisible.add(index);
    }
    setVisiblePasswords(newVisible);
  };

  const getStrengthColor = (strength: string) => {
    switch (strength.toLowerCase()) {
      case 'очень слабый': return 'text-red-600 bg-red-50';
      case 'слабый': return 'text-orange-600 bg-orange-50';
      case 'удовлетворительный': return 'text-yellow-600 bg-yellow-50';
      case 'хороший': return 'text-blue-600 bg-blue-50';
      case 'отличный': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStrengthBarColor = (score: number) => {
    if (score < 20) return 'bg-red-500';
    if (score < 40) return 'bg-orange-500';
    if (score < 60) return 'bg-yellow-500';
    if (score < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Генератор паролей
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Настройки генерации */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="length">Длина пароля: {length}</Label>
            <Slider
              id="length"
              min={8}
              max={32}
              step={1}
              value={[length]}
              onValueChange={(value) => setLength(value[0] ?? 16)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="count">Количество паролей: {count}</Label>
            <Slider
              id="count"
              min={1}
              max={10}
              step={1}
              value={[count]}
              onValueChange={(value) => setCount(value[0] ?? 3)}
              className="w-full"
            />
          </div>
        </div>

        {/* Кнопка генерации */}
        <Button 
          onClick={generatePasswords} 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Сгенерировать пароль
            </>
          )}
        </Button>

        {/* Сгенерированные пароли */}
        {passwords.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Сгенерированный пароль:</h3>
            {passwords.map((item, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Пароль:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStrengthColor(item.strength)}`}>
                    {item.strength}
                  </span>
                </div>
                
                {/* Индикатор силы пароля */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Сила пароля</span>
                    <span>{item.score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor(item.score)}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>

                {/* Поле с паролем */}
                <div className="flex items-center gap-2">
                  <Input
                    type={visiblePasswords.has(index) ? 'text' : 'password'}
                    value={item.password}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePasswordVisibility(index)}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {visiblePasswords.has(index) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(item.password, index)}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onPasswordSelect?.(item.password)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Выбрать
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Требования к паролям */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Требования к паролям:</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Минимум 8 символов</li>
            <li>• Заглавные и строчные буквы</li>
            <li>• Цифры</li>
            <li>• Специальные символы (!@#$%^&* и т.д.)</li>
            <li>• Без повторяющихся последовательностей</li>
            <li>• Без распространенных слов</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

