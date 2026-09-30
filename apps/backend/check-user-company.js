const { db } = require('./dist/db/client');
const { users_company, company } = require('./dist/db/schema/schema');
const { eq } = require('drizzle-orm');

async function checkUserCompany() {
  try {
    console.log('🔍 Проверяем права пользователя...');
    
    // Проверяем, является ли пользователь участником компании
    const userCompany = await db.select().from(users_company).where(eq(users_company.id_user, '298f2fe3-9976-4272-a72a-9eddffc29b01'));
    console.log('👤 Пользователь Александр в компаниях:', userCompany);
    
    // Проверяем, есть ли компания с таким ID
    const companyInfo = await db.select().from(company).where(eq(company.id_company, '03deb524-dd5d-4a38-b304-29099928ca1d'));
    console.log('🏢 Информация о компании ООО ЛогистГо:', companyInfo);
    
    // Проверяем, кто является владельцем компании
    const companyOwner = await db.select().from(users_company).where(eq(users_company.id_company, '03deb524-dd5d-4a38-b304-29099928ca1d'));
    console.log('👥 Участники компании ООО ЛогистГо:', companyOwner);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

checkUserCompany();
