// E:\logistgo\apps\backend\src\db\schema\schema.ts
import {pgTable,text,timestamp,boolean,uuid,pgEnum,integer,serial,uniqueIndex,
        numeric,bigint,doublePrecision,jsonb,} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------- users ----------
export const users = pgTable('users', {
  id_user: uuid('id_user').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  lastPasswordUpdate: timestamp('last_password_update', { mode: 'date' }),
  isActive: boolean('is_active').default(true),
  // MFA fields
  mfa_enabled: boolean('mfa_enabled').default(false),
  mfa_secret: text('mfa_secret'),
  mfa_recovery_codes: text('mfa_recovery_codes').array(),
  mfa_enforced_at: timestamp('mfa_enforced_at', { mode: 'date' }),
  mfa_last_verified_at: timestamp('mfa_last_verified_at', { mode: 'date' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---------- tip_company ----------
export const tip_company = pgTable('tip_company', {
  id_tip_company: serial('id_tip_company').primaryKey(),
  name_tip_company: text('name_tip_company').notNull(),
  status: boolean('status').default(false),
});

// ---------- company ----------
export const entityTypeEnum = pgEnum('entity_type', ['ИП', 'Предприятие']);

export const company = pgTable('company', {
  id_company: uuid('id_company').primaryKey().defaultRandom(),
  name_company: text('name_company').notNull(),
  unp: text('unp').notNull().unique(),
  entity_type: entityTypeEnum('entity_type').notNull(),
  ur_address: text('ur_address').notNull(),
  tel_1: text('tel_1').notNull(),
  tel_2: text('tel_2'),
  email: text('email'),
  id_tip_company: integer('id_tip_company')
    .notNull()
    .references(() => tip_company.id_tip_company, { onDelete: 'restrict' }),
  docs_approved: boolean('docs_approved').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---------- users_company ----------
export const userRoleEnum = pgEnum('user_role', ['Владелец', 'Администратор', 'Пользователь']);

export const users_company = pgTable(
  'users_company',
  {
    id_user_company: uuid('id_user_company').primaryKey().defaultRandom(),
    id_user: uuid('id_user').notNull().references(() => users.id_user, { onDelete: 'cascade' }),
    id_company: uuid('id_company').notNull().references(() => company.id_company, { onDelete: 'cascade' }),
    role: userRoleEnum('role').notNull().default('Владелец'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    users_company_user_company_role_uq: uniqueIndex('users_company_user_company_role_uq')
      .on(t.id_user, t.id_company, t.role),
    users_company_company_owner_uq: uniqueIndex('users_company_company_owner_uq')
      .on(t.id_company)
      .where(sql`${t.role} = 'Владелец'`),
  }),
);

// ---------- company_invitations ----------
export const company_invitations = pgTable(
  'company_invitations',
  {
    id_invitation: uuid('id_invitation').primaryKey().defaultRandom(),
    token: text('token').notNull().unique(), // <= оставляем это, индекс ниже убрали
    email: text('email').notNull(),
    company_id: uuid('company_id').notNull().references(() => company.id_company, { onDelete: 'cascade' }),
    role: userRoleEnum('role').notNull(),
    invited_by: uuid('invited_by').notNull().references(() => users.id_user, { onDelete: 'cascade' }),
    message: text('message'),
    is_used: boolean('is_used').default(false),
    used_at: timestamp('used_at'),
    used_by: uuid('used_by').references(() => users.id_user, { onDelete: 'set null' }),
    expires_at: timestamp('expires_at').notNull(),
    created_at: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    // Убрано дублирование уникальности токена
    // company_invitations_token_idx: uniqueIndex('company_invitations_token_idx').on(t.token),
    company_invitations_email_company_idx: uniqueIndex('company_invitations_email_company_idx').on(t.email, t.company_id),
  }),
);

// ==================== СПРАВОЧНИКИ И ТАБЛИЦЫ ДЛЯ CARGO ====================

// ---------- Payment Type Enum ----------
export const paymentTypeEnum = pgEnum('payment_type', ['Наличный', 'Безналичный', 'Карта', 'Перевод']);

// ---------- tip_zagryzki ----------
export const tip_zagryzki = pgTable('tip_zagryzki', {
  id_tip_zagryzki: serial('id_tip_zagryzki').primaryKey(),
  tip_zagryzki: text('tip_zagryzki').notNull().unique(),
  status: integer('status').default(0),
});


// ---------- tip_car (бывш. car_type) ----------
export const tip_car = pgTable('tip_car', {
  id_car_type: serial('id_car_type').primaryKey(),
  car_type: text('car_type').notNull().unique(),
  status: integer('status').default(0),
});

// ---------- cargo ----------
export const cargo = pgTable('cargo', {
  id_cargo: serial('id_cargo').primaryKey(),
  id_company: uuid('id_company')
    .notNull()
    .references(() => company.id_company, { onDelete: 'restrict', onUpdate: 'cascade' }),
  departure_point: text('departure_point').notNull(),
  arrival_point: text('arrival_point').notNull(),
  id_car_type: integer('id_car_type')
    .notNull()
    .references(() => tip_car.id_car_type, { onDelete: 'restrict', onUpdate: 'cascade' }),
  id_tip_zagryzki: integer('id_tip_zagryzki')
    .notNull()
    .references(() => tip_zagryzki.id_tip_zagryzki, { onDelete: 'restrict', onUpdate: 'cascade' }),
  opisanie: text('opisanie'),
  tonn: doublePrecision('tonn').notNull(),
  m3: doublePrecision('m3').notNull(),
  price: text('price'),
  payment: paymentTypeEnum('payment').notNull(),
  date_start: timestamp('date_start', { mode: 'date' }).notNull(),
  date_end: timestamp('date_end', { mode: 'date' }).notNull(),
  irrelevant: integer('irrelevant').default(0),
  departure_place_id: jsonb('departure_place_id')
    .$type<Record<string, { lat: number; lon: number }>>()
    .notNull().default(sql`'{}'::jsonb`),
  arrival_place_id: jsonb('arrival_place_id')
    .$type<Record<string, { lat: number; lon: number }>>()
    .notNull().default(sql`'{}'::jsonb`),
  status: integer('status').default(0),
});

// ==================== cars (JSONB для place_id→lat/lon) ====================
export const cars = pgTable('cars', {
  id_cars: serial('id_cars').primaryKey(),
  tonn_min: doublePrecision('tonn_min').notNull(),
  m3_min: doublePrecision('m3_min').notNull(),
  price: doublePrecision('price').default(0),
  status: integer('status'),
  id_company: uuid('id_company').notNull().references(() => company.id_company, { onDelete: 'restrict', onUpdate: 'cascade' }),
  subscription: boolean('subscription'),
  search: boolean('search').default(true),
  places: jsonb('places').$type<Record<string, { lat: number; lon: number }>>().notNull().default(sql`'{}'::jsonb`),
  tonn_max: doublePrecision('tonn_max').notNull(),
  m3_max: doublePrecision('m3_max').notNull(),
  title: text('title'),
  // обязательные FK со строгим удалением справочников
  id_car_type: integer('id_car_type').notNull().references(() => tip_car.id_car_type, { onDelete: 'restrict', onUpdate: 'cascade' }),
  id_tip_zagryzki: integer('id_tip_zagryzki').notNull().references(() => tip_zagryzki.id_tip_zagryzki, { onDelete: 'restrict', onUpdate: 'cascade' }),
});

// ---------- routes (маршруты перевозчиков)----------
export const routes = pgTable('routes', {
  id_routes: serial('id_routes').primaryKey(), // PK
  // Связь с машиной (cars.id_cars).
  id_cars: integer('id_cars').references(() => cars.id_cars, {
    onDelete: 'set null',onUpdate: 'cascade',
  }),
  departure_point: text('departure_point').notNull(),
  arrival_point: text('arrival_point').notNull(),
  // Координаты в формате place_id -> { lat, lon }
  places_departure: jsonb('places_departure')
    .$type<Record<string, { lat: number; lon: number }>>()
    .notNull().default(sql`'{}'::jsonb`),
  places_arrival: jsonb('places_arrival')
    .$type<Record<string, { lat: number; lon: number }>>()
    .notNull().default(sql`'{}'::jsonb`),
  date_start: timestamp('date_start', { mode: 'date' }).notNull(),
  opisanie: text('opisanie'),
});
