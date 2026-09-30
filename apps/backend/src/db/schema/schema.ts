// E:\logistgo\apps\backend\src\db\schema\schema.ts
import {pgTable,text,timestamp,boolean,uuid,pgEnum,integer,serial,uniqueIndex,index,
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
  avatar_url: text('avatar_url'), // URL аватара пользователя в MinIO
  lastPasswordUpdate: timestamp('last_password_update', { mode: 'date' }),
  isActive: boolean('is_active').default(true),
  // MFA fields
  mfa_enabled: boolean('mfa_enabled').default(false),
  mfa_secret: text('mfa_secret'),
  mfa_recovery_codes: text('mfa_recovery_codes').array(),
  mfa_enforced_at: timestamp('mfa_enforced_at', { mode: 'date' }),
  mfa_last_verified_at: timestamp('mfa_last_verified_at', { mode: 'date' }),
  // Email verification fields
  email_verification_token: text('email_verification_token'),
  email_verified_at: timestamp('email_verified_at', { mode: 'date' }),
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
  // 0 — компания активна (существует в системе, пере-регистрация запрещена без подтверждения поддержки)
  // 1 — отметка на удаление: при попытке регистрации по этому УНП все связанные данные будут очищены и компания будет создана заново
  reg_type: integer('reg_type').notNull().default(0),
  docs_approved: boolean('docs_approved').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---------- users_company ----------
export const userRoleEnum = pgEnum('user_role', ['Владелец', 'Администратор', 'Пользователь', 'Водитель']);

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

// ---------- routes_save (сохранённые маршруты пользователей) ----------
export const routes_save = pgTable('routes_save', {
  id: serial('id').primaryKey(),
  id_user: uuid('id_user')
    .notNull()
    .references(() => users.id_user, { onDelete: 'cascade' }),
  departure_point: jsonb('departure_point')
    .$type<Record<string, { lat: number; lon: number; name: string }>>()
    .notNull(),
  arrival_point: jsonb('arrival_point')
    .$type<Record<string, { lat: number; lon: number; name: string }>>()
    .notNull(),
  places_departure: jsonb('places_departure')
    .$type<Array<Record<string, { lat: number; lon: number; name: string }>>>()
    .default(sql`'[]'::jsonb`),
  created_at: timestamp('created_at').defaultNow(),
});

// ---------- cargo ----------
export const cargo = pgTable('cargo', {
  id_cargo: serial('id_cargo').primaryKey(),
  id_company: uuid('id_company')
    .notNull()
    .references(() => company.id_company, { onDelete: 'restrict', onUpdate: 'cascade' }),
  // Пользователь, создавший груз (nullable для существующих записей)
  created_by: uuid('created_by')
    .references(() => users.id_user, { onDelete: 'restrict', onUpdate: 'cascade' }),
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
  // Размеры груза в см
  length: doublePrecision('length'),
  width: doublePrecision('width'),
  height: doublePrecision('height'),
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
  route_nodes: jsonb('route_nodes')
    .$type<number[]>()
    .default(sql`'[]'::jsonb`),
  status: integer('status').default(0),
  // временные метки
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ---------- cargo_messendger ----------
export const cargo_messendger = pgTable('cargo_messendger', {
  id_cargo: serial('id_cargo').primaryKey(),
  departure_point: text('departure_point').notNull(),
  arrival_point: text('arrival_point').notNull(),
  id_car_type: integer('id_car_type')
    .notNull()
    .references(() => tip_car.id_car_type, { onDelete: 'restrict', onUpdate: 'cascade' }),
  opisanie: text('opisanie'),
  tonn: doublePrecision('tonn').notNull(),
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
  // дополнительные контакты, как в company
  tel_1: text('tel_1').notNull(),
  tel_2: text('tel_2'),
});

// ---------- report ----------
export const report = pgTable('report', {
  id: serial('id').primaryKey(),
  id_cargo: integer('id_cargo')
    .notNull()
    .references(() => cargo_messendger.id_cargo, { onDelete: 'cascade', onUpdate: 'cascade' }),
  id_user: uuid('id_user')
    .notNull()
    .references(() => users.id_user, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (t) => ({
  // Один пользователь может отметить груз только один раз
  report_user_cargo_unique: uniqueIndex('report_user_cargo_unique')
    .on(t.id_user, t.id_cargo),
}));

// ==================== cars (JSONB для place_id→lat/lon) ====================
export const cars = pgTable('cars', {
  id_cars: serial('id_cars').primaryKey(),
  tonn_min: doublePrecision('tonn_min').notNull(),
  m3_min: doublePrecision('m3_min').notNull(),
  price: doublePrecision('price').default(0),
  year: integer('year'),
  phone: text('phone'),
  status: integer('status'),
  id_company: uuid('id_company').notNull().references(() => company.id_company, { onDelete: 'restrict', onUpdate: 'cascade' }),
  subscription: boolean('subscription'),
  search: boolean('search').default(true),
  places: jsonb('places').$type<Record<string, { lat: number; lon: number; label?: string; active?: boolean }>>().notNull().default(sql`'{}'::jsonb`),
  tonn_max: doublePrecision('tonn_max').notNull(),
  m3_max: doublePrecision('m3_max').notNull(),
  title: text('title'),
  images: text('images').array(), // Массив URL изображений автомобиля в MinIO
  // обязательные FK со строгим удалением справочников
  id_car_type: integer('id_car_type').notNull().references(() => tip_car.id_car_type, { onDelete: 'restrict', onUpdate: 'cascade' }),
  id_tip_zagryzki: integer('id_tip_zagryzki').notNull().references(() => tip_zagryzki.id_tip_zagryzki, { onDelete: 'restrict', onUpdate: 'cascade' }),
  // временные метки
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ---------- cars_drivers (связь машина-водители, many-to-many) -----------
export const cars_drivers = pgTable('cars_drivers', {
  id_cars_drivers: serial('id_cars_drivers').primaryKey(),
  id_cars: integer('id_cars')
    .notNull()
    .references(() => cars.id_cars, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  id_user: uuid('id_user')
    .notNull()
    .references(() => users.id_user, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  created_at: timestamp('created_at').defaultNow(),
}, (t) => ({
  cars_drivers_unique: uniqueIndex('cars_drivers_unique')
    .on(t.id_cars, t.id_user),
}));

// ---------- routes (маршруты перевозчиков)----------
export const routes = pgTable('routes', {
  id_routes: serial('id_routes').primaryKey(), // PK
  // Связь с машиной (cars.id_cars) - обязательное поле
  id_cars: integer('id_cars')
    .notNull()
    .references(() => cars.id_cars, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  // Компания-владелец маршрута
  id_company: uuid('id_company')
    .notNull()
    .references(() => company.id_company, { onDelete: 'cascade' }),
  // Пользователь, создавший маршрут
  created_by: uuid('created_by')
    .notNull()
    .references(() => users.id_user, { onDelete: 'restrict' }),
  // Водитель на маршруте (может быть NULL, если водитель не указан)
  id_driver: uuid('id_driver')
    .references(() => users.id_user, { onDelete: 'set null', onUpdate: 'cascade' }),
  departure_point: text('departure_point').notNull(),
  arrival_point: text('arrival_point').notNull(),
  // Координаты в формате place_id -> { lat, lon, waypoints?: [...] }
  places_departure: jsonb('places_departure')
    .$type<Record<string, { lat: number; lon: number; waypoints?: Array<{ place_id: number; lat: number; lon: number; name: string }> }>>()
    .notNull().default(sql`'{}'::jsonb`),
  places_arrival: jsonb('places_arrival')
    .$type<Record<string, { lat: number; lon: number }>>()
    .notNull().default(sql`'{}'::jsonb`),
  date_start: timestamp('date_start', { mode: 'date' }).notNull(),
  opisanie: text('opisanie'),
  // Временные метки
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ---------- support_tickets ----------
export const supportStatusEnum = pgEnum('support_status', ['Открыто', 'Закрыто', 'В обработке']);
export const supportNewStatusEnum = pgEnum('support_new_status', ['Новый ответ', 'Просмотрен']);

export const support_tickets = pgTable('support_tickets', {
  id_ticket: uuid('id_ticket').primaryKey().defaultRandom(),
  id_user: uuid('id_user').notNull().references(() => users.id_user, { onDelete: 'cascade' }),
  id_company: uuid('id_company').references(() => company.id_company, { onDelete: 'set null' }),
  subject: text('subject').notNull(),
  status: supportStatusEnum('status').notNull().default('Открыто'),
  status_new: supportNewStatusEnum('status_new'),
  priority: integer('priority').default(1), // 1-низкий, 2-средний, 3-высокий
  bitrix24_ticket_id: text('bitrix24_ticket_id'),
  messages: jsonb('messages')
    .$type<Array<{ role: 'user' | 'support'; message: string; timestamp: Date; author?: string }>>()
    .notNull().default(sql`'[]'::jsonb`),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  closed_at: timestamp('closed_at'),
  closed_by: uuid('closed_by').references(() => users.id_user, { onDelete: 'set null' }),
});

// ---------- notifications ----------
export const notificationTypeEnum = pgEnum('notification_type', [
  'cargo_created',      // Создан новый груз
  'cargo_updated',      // Груз обновлен
  'cargo_deleted',      // Груз удален
  'car_created',        // Добавлен новый автомобиль
  'car_updated',        // Автомобиль обновлен
  'route_match',        // Найден подходящий маршрут
  'cargo_match',        // Найден подходящий груз
  'support_reply',      // Ответ в тикете поддержки
  'support_closed',     // Тикет поддержки закрыт
  'company_invite',     // Приглашение в компанию
  'user_added',         // Пользователь добавлен в компанию
  'user_removed',       // Пользователь удален из компании
  'role_changed',       // Изменена роль в компании
  'message_received',   // Новое сообщение в чате
  'conversation_started', // Начата новая беседа
  'system',             // Системное уведомление
]);

export const notificationPriorityEnum = pgEnum('notification_priority', [
  'low',      // Низкий приоритет
  'medium',   // Средний приоритет
  'high',     // Высокий приоритет
  'urgent',   // Срочное
]);

export const notifications = pgTable('notifications', {
  id_notification: uuid('id_notification').primaryKey().defaultRandom(),
  id_user: uuid('id_user').notNull().references(() => users.id_user, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  priority: notificationPriorityEnum('priority').notNull().default('medium'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  // Metadata для связанных сущностей
  metadata: jsonb('metadata').$type<{
    cargo_id?: number;
    car_id?: number;
    route_id?: number;
    company_id?: string;
    ticket_id?: string;
    user_id?: string;
    link?: string; // Ссылка для перехода
    [key: string]: any;
  }>().default(sql`'{}'::jsonb`),
  is_read: boolean('is_read').default(false),
  read_at: timestamp('read_at', { withTimezone: true, mode: 'date' }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

// ---------- notification_settings ----------
export const notification_settings = pgTable('notification_settings', {
  id_setting: uuid('id_setting').primaryKey().defaultRandom(),
  id_user: uuid('id_user').notNull().unique().references(() => users.id_user, { onDelete: 'cascade' }),
  
  // Email уведомления
  email_cargo_created: boolean('email_cargo_created').default(true),
  email_cargo_match: boolean('email_cargo_match').default(true),
  email_route_match: boolean('email_route_match').default(true),
  email_support_reply: boolean('email_support_reply').default(true),
  email_company_invite: boolean('email_company_invite').default(true),
  email_message_received: boolean('email_message_received').default(true),
  email_conversation_started: boolean('email_conversation_started').default(true),

  // In-app уведомления
  inapp_cargo_created: boolean('inapp_cargo_created').default(true),
  inapp_cargo_match: boolean('inapp_cargo_match').default(true),
  inapp_route_match: boolean('inapp_route_match').default(true),
  inapp_support_reply: boolean('inapp_support_reply').default(true),
  inapp_company_invite: boolean('inapp_company_invite').default(true),
  inapp_message_received: boolean('inapp_message_received').default(true),
  inapp_conversation_started: boolean('inapp_conversation_started').default(true),
  inapp_system: boolean('inapp_system').default(true),
  
  // Telegram уведомления (для будущего бота)
  telegram_enabled: boolean('telegram_enabled').default(false),
  telegram_chat_id: text('telegram_chat_id'),
  
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ==================== ЭЛЕКТРОННЫЙ ДОКУМЕНТООБОРОТ (ЭДО) ====================

// ---------- document_types ----------
export const documentTypeEnum = pgEnum('document_type', [
  'ТТН',           // Товарно-транспортная накладная
  'CMR',           // Международная накладная
  'Договор',       // Договор перевозки
  'Акт',           // Акт выполненных работ
  'Счёт',          // Счет на оплату
  'Счёт-фактура',  // Счет-фактура
  'Доверенность',  // Доверенность на водителя
  'Прочее',        // Другие документы
]);

// ---------- document_status ----------
export const documentStatusEnum = pgEnum('document_status', [
  'Черновик',      // Создан, но не завершен
  'Ожидает подписи', // Готов к подписанию
  'Подписан',      // Подписан всеми сторонами
  'Отменён',       // Отменен
  'Архив',         // В архиве
]);

// ---------- signature_status ----------
export const signatureStatusEnum = pgEnum('signature_status', [
  'Ожидает',       // Ожидает подписи
  'Подписан',      // Подписан
  'Отклонён',      // Отклонен
]);

// ---------- documents ----------
export const documents: any = pgTable('documents', {
  id_document: uuid('id_document').primaryKey().defaultRandom(),

  // Тип документа
  document_type: documentTypeEnum('document_type').notNull(),

  // Номер документа (может быть уникальным в рамках компании)
  document_number: text('document_number').notNull(),

  // Дата документа
  document_date: timestamp('document_date', { mode: 'date' }).notNull(),

  // Статус документа
  status: documentStatusEnum('status').notNull().default('Черновик'),

  // Компания-владелец документа
  id_company: uuid('id_company')
    .notNull()
    .references(() => company.id_company, { onDelete: 'cascade' }),

  // Пользователь, создавший документ
  created_by: uuid('created_by')
    .notNull()
    .references(() => users.id_user, { onDelete: 'restrict' }),

  // Название документа
  title: text('title').notNull(),

  // Описание/примечания
  description: text('description'),

  // Связанные сущности
  related_cargo_id: integer('related_cargo_id').references(() => cargo.id_cargo, { onDelete: 'set null' }),
  related_car_id: integer('related_car_id').references(() => cars.id_cars, { onDelete: 'set null' }),
  related_route_id: integer('related_route_id').references(() => routes.id_routes, { onDelete: 'set null' }),

  // Контрагент (другая компания)
  counterparty_company_id: uuid('counterparty_company_id')
    .references(() => company.id_company, { onDelete: 'set null' }),
  counterparty_name: text('counterparty_name'), // Если контрагент не в системе
  counterparty_unp: text('counterparty_unp'),
  counterparty_address: text('counterparty_address'),

  // Данные документа (JSON для гибкости)
  document_data: jsonb('document_data').$type<{
    // Для ТТН
    loading_address?: string;
    unloading_address?: string;
    cargo_name?: string;
    cargo_weight?: number;
    cargo_volume?: number;
    cargo_value?: number;
    driver_name?: string;
    driver_license?: string;
    vehicle_number?: string;
    trailer_number?: string;

    // Для договора
    contract_number?: string;
    contract_date?: string;
    payment_terms?: string;
    delivery_terms?: string;
    price?: number;
    currency?: string;

    // Для CMR
    sender?: { name: string; address: string; country: string };
    consignee?: { name: string; address: string; country: string };
    carrier?: { name: string; address: string; country: string };
    place_of_loading?: string;
    place_of_delivery?: string;

    // Дополнительные поля
    [key: string]: any;
  }>().default(sql`'{}'::jsonb`),

  // Шаблон документа (ссылка на шаблон)
  template_id: uuid('template_id').references(() => document_templates.id_template, { onDelete: 'set null' }),

  // Версия документа
  version: integer('version').notNull().default(1),

  // Родительский документ (для версионирования)
  parent_document_id: uuid('parent_document_id').references((): any => documents.id_document, { onDelete: 'set null' }),

  // PDF файл (путь или base64)
  pdf_file_path: text('pdf_file_path'),
  pdf_generated_at: timestamp('pdf_generated_at', { mode: 'date' }),

  // Метаданные
  metadata: jsonb('metadata').$type<{
    file_size?: number;
    page_count?: number;
    checksum?: string;
    [key: string]: any;
  }>().default(sql`'{}'::jsonb`),

  // Временные метки
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  archived_at: timestamp('archived_at', { mode: 'date' }),
});

// ---------- document_templates ----------
export const document_templates = pgTable('document_templates', {
  id_template: uuid('id_template').primaryKey().defaultRandom(),

  // Тип документа
  document_type: documentTypeEnum('document_type').notNull(),

  // Название шаблона
  name: text('name').notNull(),

  // Описание шаблона
  description: text('description'),

  // HTML шаблон с плейсхолдерами {{field_name}}
  html_template: text('html_template').notNull(),

  // CSS стили для шаблона
  css_styles: text('css_styles'),

  // Компания (null = системный шаблон)
  id_company: uuid('id_company').references(() => company.id_company, { onDelete: 'cascade' }),

  // Является ли шаблон активным
  is_active: boolean('is_active').default(true),

  // Системный шаблон (не может быть удален пользователями)
  is_system: boolean('is_system').default(false),

  // Поля шаблона (список доступных полей для подстановки)
  fields: jsonb('fields').$type<Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select';
    required?: boolean;
    default_value?: any;
    options?: string[]; // для select
  }>>().default(sql`'[]'::jsonb`),

  // Создатель шаблона
  created_by: uuid('created_by').references(() => users.id_user, { onDelete: 'set null' }),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ---------- document_signatures ----------
export const document_signatures = pgTable('document_signatures', {
  id_signature: uuid('id_signature').primaryKey().defaultRandom(),

  // Документ
  id_document: uuid('id_document')
    .notNull()
    .references(() => documents.id_document, { onDelete: 'cascade' }),

  // Подписант
  id_user: uuid('id_user')
    .notNull()
    .references(() => users.id_user, { onDelete: 'cascade' }),

  // Роль подписанта
  signer_role: text('signer_role').notNull(), // 'Заказчик', 'Перевозчик', 'Водитель', etc.

  // Статус подписи
  signature_status: signatureStatusEnum('signature_status').notNull().default('Ожидает'),

  // Электронная подпись (хеш документа + приватный ключ пользователя)
  signature_data: text('signature_data'),

  // IP адрес при подписании
  signature_ip: text('signature_ip'),

  // Комментарий при подписании/отклонении
  comment: text('comment'),

  // Время подписания
  signed_at: timestamp('signed_at', { mode: 'date' }),

  // Время отклонения
  rejected_at: timestamp('rejected_at', { mode: 'date' }),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ---------- document_versions ----------
export const document_versions = pgTable('document_versions', {
  id_version: uuid('id_version').primaryKey().defaultRandom(),

  // Документ
  id_document: uuid('id_document')
    .notNull()
    .references(() => documents.id_document, { onDelete: 'cascade' }),

  // Номер версии
  version: integer('version').notNull(),

  // Данные документа на момент версии
  document_data: jsonb('document_data').notNull(),

  // PDF файл версии
  pdf_file_path: text('pdf_file_path'),

  // Кто создал версию
  created_by: uuid('created_by')
    .notNull()
    .references(() => users.id_user, { onDelete: 'restrict' }),

  // Комментарий к изменениям
  change_comment: text('change_comment'),

  created_at: timestamp('created_at').defaultNow(),
});

// ---------- document_access ----------
export const document_access = pgTable('document_access', {
  id_access: uuid('id_access').primaryKey().defaultRandom(),

  // Документ
  id_document: uuid('id_document')
    .notNull()
    .references(() => documents.id_document, { onDelete: 'cascade' }),

  // Пользователь или компания
  id_user: uuid('id_user').references(() => users.id_user, { onDelete: 'cascade' }),
  id_company: uuid('id_company').references(() => company.id_company, { onDelete: 'cascade' }),

  // Права доступа
  can_view: boolean('can_view').default(true),
  can_edit: boolean('can_edit').default(false),
  can_delete: boolean('can_delete').default(false),
  can_sign: boolean('can_sign').default(false),

  // Предоставлен кем
  granted_by: uuid('granted_by')
    .notNull()
    .references(() => users.id_user, { onDelete: 'cascade' }),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ---------- reviews ----------
export const reviewStatusEnum = pgEnum('review_status', ['Ожидает модерации', 'Одобрен', 'Отклонен', 'Скрыт']);

export const reviews = pgTable('reviews', {
  id_review: uuid('id_review').primaryKey().defaultRandom(),

  // Автор отзыва
  id_reviewer: uuid('id_reviewer').notNull().references(() => users.id_user, { onDelete: 'cascade' }),
  reviewer_company_id: uuid('reviewer_company_id').references(() => company.id_company, { onDelete: 'set null' }),

  // Компания, которую оценивают
  id_reviewed_company: uuid('id_reviewed_company').notNull().references(() => company.id_company, { onDelete: 'cascade' }),

  // Оценка (1-5 звезд)
  rating: integer('rating').notNull(), // 1, 2, 3, 4, 5

  // Текстовый отзыв
  review_text: text('review_text'),

  // Статус модерации
  status: reviewStatusEnum('status').notNull().default('Ожидает модерации'),

  // Связь с тикетом поддержки (если есть жалоба или модерация)
  id_support_ticket: uuid('id_support_ticket').references(() => support_tickets.id_ticket, { onDelete: 'set null' }),

  // Модерация
  moderated_by: uuid('moderated_by').references(() => users.id_user, { onDelete: 'set null' }),
  moderated_at: timestamp('moderated_at'),
  moderation_comment: text('moderation_comment'),

  // Связь с грузом/маршрутом (опционально - для контекста сотрудничества)
  related_cargo_id: integer('related_cargo_id').references(() => cargo.id_cargo, { onDelete: 'set null' }),
  related_route_id: integer('related_route_id').references(() => routes.id_routes, { onDelete: 'set null' }),

  // Полезность отзыва (лайки)
  helpful_count: integer('helpful_count').default(0),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (t) => ({
  // Один пользователь может оставить только один отзыв на компанию
  reviews_reviewer_company_unique: uniqueIndex('reviews_reviewer_company_unique')
    .on(t.id_reviewer, t.id_reviewed_company),
}));

// ==================== МЕССЕНДЖЕР ====================

// ---------- conversations ----------
export const conversationStatusEnum = pgEnum('conversation_status', ['Активен', 'Архивирован', 'Заблокирован']);

export const conversations = pgTable('conversations', {
  id_conversation: uuid('id_conversation').primaryKey().defaultRandom(),

  // Участники беседы
  id_user1: uuid('id_user1').notNull().references(() => users.id_user, { onDelete: 'cascade' }),
  id_user2: uuid('id_user2').notNull().references(() => users.id_user, { onDelete: 'cascade' }),

  // Компании участников (для контекста)
  id_company1: uuid('id_company1').references(() => company.id_company, { onDelete: 'set null' }),
  id_company2: uuid('id_company2').references(() => company.id_company, { onDelete: 'set null' }),

  // Статус беседы
  status: conversationStatusEnum('status').notNull().default('Активен'),

  // Последнее сообщение для быстрого доступа
  last_message_id: uuid('last_message_id'),
  last_message_text: text('last_message_text'),
  last_message_at: timestamp('last_message_at'),

  // Связь с грузом/маршрутом (опционально - для контекста)
  related_cargo_id: integer('related_cargo_id').references(() => cargo.id_cargo, { onDelete: 'set null' }),
  related_route_id: integer('related_route_id').references(() => routes.id_routes, { onDelete: 'set null' }),

  // Настройки уведомлений
  user1_notifications_enabled: boolean('user1_notifications_enabled').default(true),
  user2_notifications_enabled: boolean('user2_notifications_enabled').default(true),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (t) => ({
  // Уникальная пара пользователей
  conversations_users_unique: uniqueIndex('conversations_users_unique')
    .on(t.id_user1, t.id_user2),
}));

// ---------- messages ----------
export const messageTypeEnum = pgEnum('message_type', ['text', 'file', 'image', 'system']);

export const messages = pgTable('messages', {
  id_message: uuid('id_message').primaryKey().defaultRandom(),

  // Связь с беседой
  id_conversation: uuid('id_conversation').notNull().references(() => conversations.id_conversation, { onDelete: 'cascade' }),

  // Отправитель
  id_sender: uuid('id_sender').notNull().references(() => users.id_user, { onDelete: 'cascade' }),

  // Тип сообщения
  type: messageTypeEnum('type').notNull().default('text'),

  // Содержимое сообщения
  content: text('content').notNull(),

  // Метаданные для файлов
  metadata: jsonb('metadata').$type<{
    filename?: string;
    file_size?: number;
    mime_type?: string;
    file_url?: string;
    thumbnail_url?: string;
    [key: string]: any;
  }>().default(sql`'{}'::jsonb`),

  // Статус сообщения
  is_read: boolean('is_read').default(false),
  read_at: timestamp('read_at'),

  // Редактирование
  is_edited: boolean('is_edited').default(false),
  edited_at: timestamp('edited_at'),

  // Удаление
  is_deleted: boolean('is_deleted').default(false),
  deleted_at: timestamp('deleted_at'),
  deleted_by: uuid('deleted_by').references(() => users.id_user, { onDelete: 'set null' }),

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ---------- message_read_status ----------
export const message_read_status = pgTable('message_read_status', {
  id_read_status: uuid('id_read_status').primaryKey().defaultRandom(),

  // Связь с сообщением
  id_message: uuid('id_message').notNull().references(() => messages.id_message, { onDelete: 'cascade' }),

  // Пользователь, который прочитал
  id_user: uuid('id_user').notNull().references(() => users.id_user, { onDelete: 'cascade' }),

  // Время прочтения
  read_at: timestamp('read_at').defaultNow(),
}, (t) => ({
  // Один пользователь может прочитать сообщение только один раз
  message_read_status_unique: uniqueIndex('message_read_status_unique')
    .on(t.id_message, t.id_user),
}));

// ==================== CRM МОДУЛЬ ====================

// ---------- CRM Enums ----------
export const crmCompanyKindEnum = pgEnum('crm_company_kind_enum', ['carrier', 'customer']);
export const crmTrustTypeEnum = pgEnum('crm_trust_type_enum', ['new', 'unverified', 'reliable']);
export const crmCustomFieldTypeEnum = pgEnum('crm_custom_field_type_enum', ['text', 'number', 'date', 'select', 'boolean']);

// ---------- crm_companies ----------
export const crm_companies = pgTable('crm_companies', {
  id_crm_company: uuid('id_crm_company').primaryKey().defaultRandom(),
  workspace_company_id: uuid('workspace_company_id').notNull().references(() => company.id_company, { onDelete: 'cascade' }),
  created_by: uuid('created_by').notNull().references(() => users.id_user, { onDelete: 'restrict' }),
  kind: crmCompanyKindEnum('kind').notNull(),
  trust_type: crmTrustTypeEnum('trust_type').notNull(),
  name: text('name').notNull(),
  unp: text('unp'),
  legal_address: jsonb('legal_address').default(sql`'{}'::jsonb`),
  postal_address: jsonb('postal_address').default(sql`'{}'::jsonb`),
  payment_terms: jsonb('payment_terms').default(sql`'{}'::jsonb`),
  bank_details: jsonb('bank_details').default(sql`'{}'::jsonb`),
  note: text('note'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (t) => ({
  crm_companies_workspace_kind_idx: index('crm_companies_workspace_kind_idx').on(t.workspace_company_id, t.kind),
  crm_companies_unp_idx: index('crm_companies_unp_idx').on(t.unp),
  crm_companies_name_idx: index('crm_companies_name_idx').on(t.name),
}));

// ---------- crm_companies_users ----------
export const crm_companies_users = pgTable('crm_companies_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  id_crm_company: uuid('id_crm_company').notNull().references(() => crm_companies.id_crm_company, { onDelete: 'cascade' }),
  id_user: uuid('id_user').notNull().references(() => users.id_user, { onDelete: 'cascade' }),
  workspace_company_id: uuid('workspace_company_id').notNull().references(() => company.id_company, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow(),
}, (t) => ({
  crm_companies_users_unique: uniqueIndex('crm_companies_users_unique')
    .on(t.id_crm_company, t.id_user, t.workspace_company_id),
}));

// ---------- crm_contacts ----------
export const crm_contacts = pgTable('crm_contacts', {
  id_contact: uuid('id_contact').primaryKey().defaultRandom(),
  id_crm_company: uuid('id_crm_company').notNull().references(() => crm_companies.id_crm_company, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  position: text('position'),
  note: text('note'),
  created_at: timestamp('created_at').defaultNow(),
});

// ---------- crm_drivers ----------
export const crm_drivers = pgTable('crm_drivers', {
  id_driver: uuid('id_driver').primaryKey().defaultRandom(),
  workspace_company_id: uuid('workspace_company_id').notNull().references(() => company.id_company, { onDelete: 'cascade' }),
  created_by: uuid('created_by').notNull().references(() => users.id_user, { onDelete: 'restrict' }),
  full_name: text('full_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  note: text('note'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ---------- crm_company_drivers ----------
export const crm_company_drivers = pgTable('crm_company_drivers', {
  id_link: uuid('id_link').primaryKey().defaultRandom(),
  workspace_company_id: uuid('workspace_company_id').notNull().references(() => company.id_company, { onDelete: 'cascade' }),
  id_crm_company: uuid('id_crm_company').notNull().references(() => crm_companies.id_crm_company, { onDelete: 'cascade' }),
  id_driver: uuid('id_driver').notNull().references(() => crm_drivers.id_driver, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow(),
}, (t) => ({
  crm_company_drivers_unique: uniqueIndex('crm_company_drivers_unique')
    .on(t.id_crm_company, t.id_driver),
}));

// ---------- crm_vehicles ----------
export const crm_vehicles = pgTable('crm_vehicles', {
  id_vehicle: uuid('id_vehicle').primaryKey().defaultRandom(),
  workspace_company_id: uuid('workspace_company_id').notNull().references(() => company.id_company, { onDelete: 'cascade' }),
  id_crm_company: uuid('id_crm_company').notNull().references(() => crm_companies.id_crm_company, { onDelete: 'cascade' }),
  created_by: uuid('created_by').notNull().references(() => users.id_user, { onDelete: 'restrict' }),
  plate_number: text('plate_number').notNull(),
  brand: text('brand'),
  model: text('model'),
  year: integer('year'),
  vin: text('vin'),
  note: text('note'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (t) => ({
  crm_vehicles_workspace_company_idx: index('crm_vehicles_workspace_company_idx').on(t.workspace_company_id, t.id_crm_company),
  crm_vehicles_plate_number_idx: index('crm_vehicles_plate_number_idx').on(t.plate_number),
}));

// ---------- crm_vehicle_drivers ----------
export const crm_vehicle_drivers = pgTable('crm_vehicle_drivers', {
  id_link: uuid('id_link').primaryKey().defaultRandom(),
  workspace_company_id: uuid('workspace_company_id').notNull().references(() => company.id_company, { onDelete: 'cascade' }),
  id_vehicle: uuid('id_vehicle').notNull().references(() => crm_vehicles.id_vehicle, { onDelete: 'cascade' }),
  id_driver: uuid('id_driver').notNull().references(() => crm_drivers.id_driver, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow(),
}, (t) => ({
  crm_vehicle_drivers_unique: uniqueIndex('crm_vehicle_drivers_unique')
    .on(t.id_vehicle, t.id_driver),
}));

// ---------- crm_field_prefs ----------
export const crm_field_prefs = pgTable('crm_field_prefs', {
  id_pref: uuid('id_pref').primaryKey().defaultRandom(),
  workspace_company_id: uuid('workspace_company_id').notNull().references(() => company.id_company, { onDelete: 'cascade' }),
  id_user: uuid('id_user').notNull().references(() => users.id_user, { onDelete: 'cascade' }),
  kind: crmCompanyKindEnum('kind').notNull(),
  prefs: jsonb('prefs').notNull().default(sql`'{"version":1,"fields":[]}'::jsonb`),
  updated_at: timestamp('updated_at').defaultNow(),
}, (t) => ({
  crm_field_prefs_unique: uniqueIndex('crm_field_prefs_unique')
    .on(t.workspace_company_id, t.id_user, t.kind),
}));

// ---------- crm_custom_fields ----------
export const crm_custom_fields = pgTable('crm_custom_fields', {
  id_field: uuid('id_field').primaryKey().defaultRandom(),
  workspace_company_id: uuid('workspace_company_id').notNull().references(() => company.id_company, { onDelete: 'cascade' }),
  id_user: uuid('id_user').notNull().references(() => users.id_user, { onDelete: 'cascade' }),
  kind: crmCompanyKindEnum('kind').notNull(),
  key: text('key').notNull(),
  label: text('label').notNull(),
  type: crmCustomFieldTypeEnum('type').notNull(),
  options: jsonb('options').default(sql`'[]'::jsonb`),
  created_at: timestamp('created_at').defaultNow(),
}, (t) => ({
  crm_custom_fields_unique: uniqueIndex('crm_custom_fields_unique')
    .on(t.workspace_company_id, t.id_user, t.kind, t.key),
}));

// ---------- crm_custom_values ----------
export const crm_custom_values = pgTable('crm_custom_values', {
  id_value: uuid('id_value').primaryKey().defaultRandom(),
  id_crm_company: uuid('id_crm_company').notNull().references(() => crm_companies.id_crm_company, { onDelete: 'cascade' }),
  id_field: uuid('id_field').notNull().references(() => crm_custom_fields.id_field, { onDelete: 'cascade' }),
  value: jsonb('value').notNull().default(sql`'{}'::jsonb`),
}, (t) => ({
  crm_custom_values_unique: uniqueIndex('crm_custom_values_unique')
    .on(t.id_crm_company, t.id_field),
}));