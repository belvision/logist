/**
 * Конфигурация фоновых изображений для лендинговых страниц
 * Все изображения хранятся в MinIO и могут быть легко изменены
 * 
 * Формат пути: backgrounds/{page}/{image-name}.{ext}
 * Полный URL: {MINIO_BASE_URL}/logistic-pro/backgrounds/{page}/{image-name}.{ext}
 */

// Базовый URL MinIO (можно переопределить через переменные окружения)
const MINIO_BASE_URL = process.env.NEXT_PUBLIC_MINIO_BASE_URL || 'https://io.logistgo.pro';
const MINIO_BUCKET = process.env.NEXT_PUBLIC_MINIO_BUCKET || 'logistic-pro';

/**
 * Формирует полный URL изображения из MinIO
 * @param path - путь к изображению относительно папки backgrounds (например: 'home/hero-bg.jpg')
 * @returns полный URL изображения
 */
export function getBackgroundImageUrl(path: string): string {
  return `${MINIO_BASE_URL}/${MINIO_BUCKET}/backgrounds/${path}`;
}

/**
 * Конфигурация фоновых изображений для каждой страницы
 * Если изображение не указано или не загрузится, будет использован градиентный фон
 */
export const backgroundImages = {
  // Главная страница
  home: {
    hero: getBackgroundImageUrl('home/hero-bg.webp'),
    // Можно добавить другие секции
    // features: getBackgroundImageUrl('home/features-bg.webp'),
  },
  
  // Страница для перевозчиков
  carriers: {
    hero: getBackgroundImageUrl('carriers/hero-bg.webp'),
  },
  
  // Страница для грузовладельцев
  cargoOwners: {
    hero: getBackgroundImageUrl('cargo-owners/hero-bg.webp'),
  },
  
  // Страница команды
  team: {
    hero: getBackgroundImageUrl('team/hero-bg.webp'),
  },
  
  // Страницы стран (динамические)
  countries: {
    hero: (countrySlug: string) => getBackgroundImageUrl(`countries/${countrySlug}/hero-bg.jpg`),
  },
  
  // Другие публичные страницы
  carriersAddTransport: {
    hero: getBackgroundImageUrl('carriers/add-transport-hero-bg.webp'),
  },
  
  carriers7Steps: {
    hero: getBackgroundImageUrl('carriers/7-steps-hero-bg.webp'),
    step: (stepNumber: number) => getBackgroundImageUrl(`carriers/7-steps/step-${stepNumber}.webp`),
  },
  
  carriersLicenses: {
    hero: getBackgroundImageUrl('carriers/licenses-hero-bg.webp'),
  },
  
  socialCargo: {
    hero: getBackgroundImageUrl('social-cargo/hero-bg.webp'),
  },
} as const;

/**
 * Типы для фоновых изображений
 */
export type BackgroundImageKey = keyof typeof backgroundImages;

