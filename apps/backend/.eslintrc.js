module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'unused-imports'],
  rules: {
    // Строгие правила для проверки типов
    '@typescript-eslint/no-explicit-any': 'error',
    
    // Строгие правила для типизации (упрощенные)
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    
    // Отключаем стандартное правило no-unused-vars, так как используем unused-imports
    '@typescript-eslint/no-unused-vars': 'off',
    
    // Используем плагин unused-imports для более точного определения неиспользуемых импортов
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    
    // Общие правила
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': [
      'error',
      {
        allow: ['warn', 'error'],
      },
    ],
  },
  ignorePatterns: ['node_modules/', 'dist/'],
};
