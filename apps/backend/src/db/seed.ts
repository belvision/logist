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
      password: 'admin12345',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
    },
    {
      username: 'manager',
      email: 'manager@example.com',
      password: 'manager12345',
      firstName: 'Manager',
      lastName: 'User',
      isActive: true,
    },
    {
      username: 'kolina18',
      email: 'kolina18@yandex.ru',
      password: '90UpRdf2OFmVRrJZ7n4W==@@#3',
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
    }
  }

}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnect();
  });
