'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  onStrengthChange?: (strength: { score: number; level: string; isValid: boolean }) => void;
  showSuggestions?: boolean;
  className?: string;
}

interface PasswordStrength {
  isValid: boolean;
  score: number;
  strength: string;
  strengthLabel: string;
  errors: string[];
  suggestions: string[];
}

export function PasswordStrengthIndicator({ 
  password, 
  onStrengthChange, 
  showSuggestions = true,
  className = '' 
}: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const checkPasswordStrength = useCallback(async (pwd: string) => {
    if (!pwd || pwd.length === 0) {
      setStrength(null);
      onStrengthChange?.({ score: 0, level: 'none', isValid: false });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/check-password-strength', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStrength(data);
        onStrengthChange?.({
          score: data.score,
          level: data.strength,
          isValid: data.isValid
        });
      } else {
        console.error('Ошибка проверки пароля:', data.error);
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false);
    }
  }, [onStrengthChange]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkPasswordStrength(password);
    }, 300); // Debounce на 300ms

    return () => clearTimeout(timeoutId);
  }, [password, checkPasswordStrength]);

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'very-weak': return 'text-red-600 bg-red-50 border-red-200';
      case 'weak': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'strong': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStrengthBarColor = (score: number) => {
    if (score < 20) return 'bg-red-500';
    if (score < 40) return 'bg-orange-500';
    if (score < 60) return 'bg-yellow-500';
    if (score < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthIcon = (level: string) => {
    switch (level) {
      case 'very-weak':
      case 'weak':
      case 'fair':
        return <AlertCircle className="h-4 w-4" />;
      case 'good':
      case 'strong':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Индикатор силы пароля */}
      {strength && (
        <div className={`border rounded-lg p-3 ${getStrengthColor(strength.strength)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStrengthIcon(strength.strength)}
              <span className="font-medium">
                {strength.strengthLabel} ({strength.score}/100)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {/* Прогресс-бар */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor(strength.score)}`}
              style={{ width: `${strength.score}%` }}
            />
          </div>

          {/* Показ пароля */}
          {showPassword && (
            <div className="font-mono text-sm bg-white/50 dark:bg-gray-700/50 rounded p-2 mb-2 text-gray-900 dark:text-white">
              {password}
            </div>
          )}
        </div>
      )}

      {/* Ошибки */}
      {strength && strength.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Требования не выполнены:</h4>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {strength.errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Предложения */}
      {showSuggestions && strength && strength.suggestions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Рекомендации:</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            {strength.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Индикатор загрузки */}
      {loading && (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-400"></div>
          <span className="text-sm">Проверка пароля...</span>
        </div>
      )}
    </div>
  );
}

