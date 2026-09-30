#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env.local');
const prodFile = path.join(__dirname, '.env.production');

const args = process.argv.slice(2);
const env = args[0] || 'dev';

if (env === 'prod') {
  // Переключаемся на продакшен
  if (fs.existsSync(prodFile)) {
    fs.copyFileSync(prodFile, envFile);
    console.log('✅ Переключено на продакшен (.env.production -> .env.local)');
    console.log('   API URL: http://0.0.0.0:5555');
  } else {
    console.log('❌ Файл .env.production не найден');
  }
} else if (env === 'dev') {
  // Переключаемся на разработку
  const devContent = `# Для разработки используем localhost, для продакшена - 0.0.0.0
NEXT_PUBLIC_API_BASE_URL=http://localhost:5555`;
  
  fs.writeFileSync(envFile, devContent);
  console.log('✅ Переключено на разработку');
  console.log('   API URL: http://localhost:5555');
} else {
  console.log('Использование:');
  console.log('  node switch-env.js dev   - переключиться на разработку');
  console.log('  node switch-env.js prod  - переключиться на продакшен');
}
