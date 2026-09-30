// Type definitions for cargo and car entities used in the cargo pages.

// Информация о грузе. По необходимости можно расширить полями,
// соответствующими модели груза на бэкенде (описание, дата, пункт отправления и т.п.).
export interface Cargo {
  id: number;
  name: string;
  /**
   * Описание груза. Может отсутствовать, поэтому поле опциональное.
   */
  description?: string;
  /** Масса груза в тоннах. */
  tonn: number;
  /** Объём груза в кубических метрах. */
  m3: number;
  /**
   * Пункт отправления груза (населённый пункт или адрес).
   * На сервере хранится в колонке departure_point.
   */
  departure_point?: string;
  /**
   * Пункт назначения груза (конечная точка), колонка может называться arrival_point или destination.
   */
  arrival_point?: string;
  // другие свойства могут быть добавлены здесь
}

// Информация об автомобиле для отображения в результатах поиска.
// Включены основные поля; при необходимости можно расширить.
export interface Car {
  id: number;
  tonn_min?: number;
  tonn_max?: number;
  m3_min?: number;
  m3_max?: number;
  // список мест, где находится автомобиль (lat/lon)
  places?: Record<string, { lat: number; lon: number }>;
}
