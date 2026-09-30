import 'dotenv/config';
import db, { disconnect } from './client';
import { users } from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function main() {
  const rawUsers = [
    {
      username: 'admin',
      email: 'admin@example.com',
      password: 'REDACTED_SECRET',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
    },
    {
      username: 'manager',
      email: 'manager@example.com',
      password: 'REDACTED_SECRET',
      firstName: 'Manager',
      lastName: 'User',
      isActive: true,
    },
    {
      username: 'kolina18',
      email: 'kolina18@yandex.ru',
      password: 'REDACTED_SECRET',
      firstName: 'Kolina',
      lastName: 'User',
      isActive: true,
    },
  ];

  for (const u of rawUsers) {
    const hash = await bcrypt.hash(u.password, 10);
    const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);

    if (existing.length > 0) {
      // Обновляем существующего пользователя
      await db
        .update(users)
        .set({
          username: u.username,
          password: hash,
          firstName: u.firstName,
          lastName: u.lastName,
          isActive: u.isActive,
        })
        .where(eq(users.email, u.email));
      console.log(`Updated user: ${u.email}`);
    } else {
      // Создаем нового пользователя
      await db.insert(users).values({
        username: u.username,
        email: u.email,
        password: hash,
        firstName: u.firstName,
        lastName: u.lastName,
        isActive: u.isActive,
      });
      console.log(`Created user: ${u.email}`);
    }
  }

  console.log('Seed users upserted.');
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnect();
  });




