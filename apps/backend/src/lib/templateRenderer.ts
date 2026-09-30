// apps/backend/src/lib/templateRenderer.ts

export class TemplateRenderer {
  /**
   * Рендерит HTML шаблон, заменяя плейсхолдеры {{field_name}} на значения из data
   */
  render(template: string, data: Record<string, any>): string {
    let result = template;

    // Заменяем простые плейсхолдеры {{field_name}}
    result = result.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined && value !== null ? String(value) : '';
    });

    // Поддержка условных блоков {{#if field}}...{{/if}}
    result = result.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, path, content) => {
      const value = this.getNestedValue(data, path);
      return value ? content : '';
    });

    // Поддержка условных блоков {{#unless field}}...{{/unless}}
    result = result.replace(/\{\{#unless\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, path, content) => {
      const value = this.getNestedValue(data, path);
      return !value ? content : '';
    });

    // Поддержка циклов {{#each items}}...{{/each}}
    result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, itemTemplate) => {
      const array = this.getNestedValue(data, arrayName);
      if (!Array.isArray(array)) return '';
      
      return array.map((item, index) => {
        let itemHtml = itemTemplate;
        // Заменяем {{this}} на значение элемента
        itemHtml = itemHtml.replace(/\{\{this\}\}/g, String(item));
        // Заменяем {{@index}} на индекс
        itemHtml = itemHtml.replace(/\{\{@index\}\}/g, String(index));
        // Заменяем вложенные поля {{item.field}}
        if (typeof item === 'object' && item !== null) {
          itemHtml = itemHtml.replace(/\{\{(\w+)\}\}/g, (m: any, field: any) => {
            return item[field] !== undefined ? String(item[field]) : '';
          });
        }
        return itemHtml;
      }).join('');
    });

    // Форматирование дат {{formatDate field}}
    result = result.replace(/\{\{formatDate\s+(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      if (!value) return '';
      try {
        const date = new Date(value);
        return date.toLocaleDateString('ru-RU');
      } catch {
        return String(value);
      }
    });

    // Форматирование чисел {{formatNumber field}}
    result = result.replace(/\{\{formatNumber\s+(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      if (value === undefined || value === null) return '';
      try {
        return Number(value).toLocaleString('ru-RU');
      } catch {
        return String(value);
      }
    });

    // Форматирование валюты {{formatCurrency field}}
    result = result.replace(/\{\{formatCurrency\s+(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      if (value === undefined || value === null) return '';
      try {
        return Number(value).toLocaleString('ru-RU', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + ' руб.';
      } catch {
        return String(value);
      }
    });

    return result;
  }

  /**
   * Получает значение по вложенному пути (например, "sender.name")
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === undefined || result === null) return undefined;
      result = result[key];
    }
    
    return result;
  }

  /**
   * Валидирует шаблон на предмет корректности синтаксиса
   */
  validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Проверяем парность условных блоков
    const ifMatches = template.match(/\{\{#if\s+\w+\}\}/g);
    const ifCloses = template.match(/\{\{\/if\}\}/g);
    if ((ifMatches?.length || 0) !== (ifCloses?.length || 0)) {
      errors.push('Несовпадение количества {{#if}} и {{/if}}');
    }

    // Проверяем парность unless блоков
    const unlessMatches = template.match(/\{\{#unless\s+\w+\}\}/g);
    const unlessCloses = template.match(/\{\{\/unless\}\}/g);
    if ((unlessMatches?.length || 0) !== (unlessCloses?.length || 0)) {
      errors.push('Несовпадение количества {{#unless}} и {{/unless}}');
    }

    // Проверяем парность each блоков
    const eachMatches = template.match(/\{\{#each\s+\w+\}\}/g);
    const eachCloses = template.match(/\{\{\/each\}\}/g);
    if ((eachMatches?.length || 0) !== (eachCloses?.length || 0)) {
      errors.push('Несовпадение количества {{#each}} и {{/each}}');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Извлекает все переменные из шаблона
   */
  extractVariables(template: string): string[] {
    const variables = new Set<string>();

    // Простые переменные {{field}}
    const simpleMatches = template.matchAll(/\{\{(\w+(?:\.\w+)*)\}\}/g);
    for (const match of simpleMatches) {
      variables.add(match[1]);
    }

    // Переменные в условиях {{#if field}}
    const ifMatches = template.matchAll(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}/g);
    for (const match of ifMatches) {
      variables.add(match[1]);
    }

    // Переменные в unless {{#unless field}}
    const unlessMatches = template.matchAll(/\{\{#unless\s+(\w+(?:\.\w+)*)\}\}/g);
    for (const match of unlessMatches) {
      variables.add(match[1]);
    }

    // Массивы в each {{#each items}}
    const eachMatches = template.matchAll(/\{\{#each\s+(\w+)\}\}/g);
    for (const match of eachMatches) {
      variables.add(match[1]);
    }

    // Переменные в форматировании
    const formatMatches = template.matchAll(/\{\{format\w+\s+(\w+(?:\.\w+)*)\}\}/g);
    for (const match of formatMatches) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }
}

export default new TemplateRenderer();

