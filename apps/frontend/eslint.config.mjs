// apps/frontend/eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Базовые конфиги Next + TypeScript
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Игноры для артефактов сборки
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "postcss.config.js",
      "tailwind.config.js",
    ],
  },

  // Строгие правила для проверки типизации
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Включаем строгую проверку типов
      "@typescript-eslint/no-explicit-any": "error",
      
      // Проверка неиспользуемых переменных
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Строгие правила для React
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
      
      // Общие правила
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "warn",
    },
  },

];

export default eslintConfig;
