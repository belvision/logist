'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Eye, EyeOff, Check, RefreshCw } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface PasswordGenerateButtonProps {
  onPasswordGenerated: (password: string) => void;
  className?: string;
}

export function PasswordGenerateButton({ onPasswordGenerated, className }: PasswordGenerateButtonProps) {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePassword = async () => {
    setIsGenerating(true);
    try {
      // Генерируем сложный пароль
      const password = generateComplexPassword();
      setGeneratedPassword(password);
      onPasswordGenerated(password);
      showToast.success('Пароль сгенерирован и заполнен!');
    } catch (error) {
      showToast.error('Ошибка генерации пароля');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateComplexPassword = (): string => {
    const length = 16;
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Гарантируем наличие всех типов символов
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Заполняем остальную длину
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Перемешиваем символы
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const copyToClipboard = async () => {
    if (!generatedPassword) return;
    
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setIsCopied(true);
      showToast.success('Пароль скопирован в буфер обмена!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      showToast.error('Ошибка копирования пароля');
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Кнопка генерации */}
      <Button
        type="button"
        variant="outline"
        onClick={generatePassword}
        disabled={isGenerating}
        className="w-full border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-600 dark:hover:border-blue-300 bg-white dark:bg-gray-800"
      >
        {isGenerating ? (
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

      {/* Поле с сгенерированным паролем */}
      {generatedPassword && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Сгенерированный пароль:
          </label>
          <div className="flex items-center gap-2">
            <Input
              type={isVisible ? 'text' : 'password'}
              value={generatedPassword}
              readOnly
              className="font-mono text-sm bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleVisibility}
              className="border-2 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {isVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="border-2 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
