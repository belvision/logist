'use client';

import { useState, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface BackgroundImageProps {
  /**
   * URL изображения из MinIO
   */
  imageUrl?: string | null;
  
  /**
   * CSS классы для градиентного фона (fallback)
   * Например: 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900'
   */
  gradientClass?: string;
  
  /**
   * Инлайн стили для градиентного фона (fallback)
   */
  gradientStyle?: CSSProperties;
  
  /**
   * Дополнительные CSS классы
   */
  className?: string;
  
  /**
   * Прозрачность overlay поверх изображения (0-1)
   * По умолчанию 0.3 для лучшей читаемости текста
   */
  overlayOpacity?: number;
  
  /**
   * Цвет overlay (по умолчанию черный)
   */
  overlayColor?: string;
  
  /**
   * Показывать ли паттерн поверх изображения
   */
  showPattern?: boolean;
  
  /**
   * Дочерние элементы
   */
  children?: React.ReactNode;
}

/**
 * Компонент для фоновых изображений с fallback на градиент
 * Автоматически переключается на градиент, если изображение не загрузилось
 */
export function BackgroundImage({
  imageUrl,
  gradientClass,
  gradientStyle,
  className,
  overlayOpacity = 0.3,
  overlayColor = 'black',
  showPattern = true,
  children,
}: BackgroundImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Если нет URL изображения или произошла ошибка загрузки, используем градиент
  const useGradient = !imageUrl || imageError;

  // Паттерн SVG для текстуры
  const patternSvg = "data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        useGradient && gradientClass,
        className
      )}
      style={useGradient ? gradientStyle : undefined}
    >
      {/* Фоновое изображение */}
      {imageUrl && !imageError && (
        <>
          <div
            className={cn(
              'absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              backgroundImage: `url('${imageUrl}')`,
            }}
            onError={() => setImageError(true)}
          />
          {/* Предзагрузка изображения для проверки доступности */}
          <img
            src={imageUrl}
            alt=""
            className="hidden"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </>
      )}

      {/* Overlay для лучшей читаемости текста */}
      {!useGradient && imageLoaded && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `${overlayColor}`,
            opacity: overlayOpacity,
          }}
        />
      )}

      {/* Паттерн поверх изображения (опционально) */}
      {showPattern && !useGradient && imageLoaded && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('${patternSvg}')`,
          }}
        />
      )}

      {/* Контент */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

