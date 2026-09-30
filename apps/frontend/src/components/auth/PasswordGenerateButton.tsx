'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface PasswordGenerateButtonProps {
  onPasswordGenerated: (password: string) => void;
  className?: string;
}

export function PasswordGenerateButton({ onPasswordGenerated }: PasswordGenerateButtonProps) {
  const [generatedPassword, setGeneratedPassword] = useState('');
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
    } catch {
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

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={generatePassword}
        disabled={isGenerating}
        className="w-full !border-primary/30 hover:!border-primary "
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

      {generatedPassword && (
        <div className="space-y-2 mt-3">
          <label className="text-sm font-medium text-foreground">
            Сгенерированный пароль:
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              {generatedPassword}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="border-input"
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
