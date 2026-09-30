// Centralized OpenAPI spec for Swagger UI
export const openapi = {
  openapi: '3.0.0',
  info: {
    title: 'Logistgo Pro API',
    version: '1.0.0',
    description:
      'REST API для Logistic Pro. Полнофункциональная система управления логистическими компаниями с поддержкой:\n\n' +
      '• **Аутентификация и авторизация** - регистрация, вход, JWT токены\n' +
      '• **Управление компаниями** - создание, просмотр, типы компаний\n' +
      '• **Управление пользователями** - добавление, приглашение, изменение ролей\n' +
      '• **Система ролей** - Владелец, Администратор, Пользователь\n\n' +
      'Токены формата JWT передавать в заголовке `Authorization: Bearer <token>`.\n\n' +
      '**Базовый URL:** `http://localhost:8080/api`',
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      CreateCompanyRequest: {
        type: 'object',
        required: ['name_company', 'unp', 'entity_type', 'ur_address', 'tel_1', 'id_tip_company'],
        properties: {
          name_company: {
            type: 'string',
            example: 'ООО «Логистик Про»',
            description: 'Полное наименование компании',
          },
          unp: {
            type: 'string',
            minLength: 9,
            maxLength: 9,
            example: '123456789',
            description: 'УНП (ровно 9 символов)',
          },
          entity_type: {
            type: 'string',
            enum: ['ИП', 'Предприятие'],
            example: 'Предприятие',
            description: 'Тип юр. лица',
          },
          ur_address: {
            type: 'string',
            example: 'г. Минск, ул. Примерная, д. 10',
            description: 'Юридический адрес',
          },
          tel_1: {
            type: 'string',
            example: '+375291112233',
            description: 'Основной телефон',
          },
          tel_2: {
            type: 'string',
            nullable: true,
            example: '+375291112234',
            description: 'Дополнительный телефон (необязательно)',
          },
          email: {
            type: 'string',
            format: 'email',
            nullable: true,
            example: 'info@logisticpro.by',
            description: 'Email компании (необязательно)',
          },
          id_tip_company: {
            type: 'integer',
            example: 1,
            description: 'ID из справочника типов компании (tip_company.id_tip_company)',
          },
        },
        description: 'Данные для создания компании',
      },
      Company: {
        type: 'object',
        properties: {
          id_company: { type: 'string', format: 'uuid', example: '03deb524-dd5d-4a38-b304-29099928ca1d' },
          name_company: { type: 'string', example: 'ООО «Логистик Про»' },
          unp: { type: 'string', example: '123456789' },
          entity_type: { type: 'string', enum: ['ИП', 'Предприятие'], example: 'Предприятие' },
          ur_address: { type: 'string', example: 'г. Минск, ул. Примерная, д. 10' },
          tel_1: { type: 'string', example: '+375291112233' },
          tel_2: { type: 'string', nullable: true, example: '+375291112234' },
          email: { type: 'string', format: 'email', nullable: true, example: 'info@logisticpro.by' },
          id_tip_company: { type: 'integer', example: 1 },
          docs_approved: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time', example: '2025-01-18T21:18:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2025-01-18T21:18:00.000Z' },
        },
        description: 'Сущность компании',
      },
      RegisterRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
            example: 'user@example.com',
            description: 'Логин пользователя. В данном проекте используется email.',
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'password123',
            description: 'Пароль (минимум 8 символов). Будет захэширован на сервере.',
          },
          firstName: {
            type: 'string',
            example: 'John',
            description: 'Имя пользователя (необязательное поле).',
          },
          lastName: {
            type: 'string',
            example: 'Doe',
            description: 'Фамилия пользователя (необязательное поле).',
          },
          inviteToken: {
            type: 'string',
            example: 'REDACTED_SECRET',
            description: 'Токен приглашения для автоматического присоединения к компании (необязательное поле).',
          },
        },
        description: 'Тело запроса для регистрации нового пользователя.',
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
            example: 'user@example.com',
            description: 'Логин пользователя (email).',
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'password123',
            description: 'Пароль пользователя.',
          },
        },
        description: 'Тело запроса для входа в систему.',
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Logged in', description: 'Служебное сообщение об успешной операции.' },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                example: 'REDACTED_SECRET',
                description: 'JWT, использовать в заголовке Authorization: Bearer <token>.',
              },
            },
          },
        },
        description: 'Ответ успешной аутентификации/регистрации с JWT токеном.',
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Validation error', description: 'Краткое описание ошибки.' },
          error: { type: 'string', description: 'Сообщение об ошибке (если есть).' },
          errors: { type: 'object', description: 'Детализация ошибок валидации.' },
        },
        description: 'Стандартное представление ошибки.',
      },
      // === ДОБАВЛЕНО: Полный ответ me ===
      MeResponse: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id_user: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              username: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        description: 'Полный объект пользователя',
      },
      // === СХЕМЫ ДЛЯ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ КОМПАНИИ ===
      AddUserToCompanyRequest: {
        type: 'object',
        required: ['email', 'role'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
            description: 'Email существующего пользователя для добавления в компанию',
          },
          role: {
            type: 'string',
            enum: ['Администратор', 'Пользователь'],
            example: 'Пользователь',
            description: 'Роль пользователя в компании (Владелец нельзя назначить через API)',
          },
        },
        description: 'Запрос на добавление существующего пользователя в компанию',
      },
      InviteUserToCompanyRequest: {
        type: 'object',
        required: ['email', 'role'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'newuser@example.com',
            description: 'Email пользователя для приглашения в компанию',
          },
          role: {
            type: 'string',
            enum: ['Администратор', 'Пользователь'],
            example: 'Пользователь',
            description: 'Роль пользователя в компании',
          },
          message: {
            type: 'string',
            example: 'Добро пожаловать в нашу команду!',
            description: 'Персональное сообщение в приглашении (необязательно)',
          },
        },
        description: 'Запрос на приглашение нового пользователя в компанию',
      },
      UserInCompany: {
        type: 'object',
        properties: {
          id_user: {
            type: 'string',
            format: 'uuid',
            example: '5376cc87-5869-46b5-abb1-b7eb909c858d',
            description: 'Уникальный идентификатор пользователя',
          },
          username: {
            type: 'string',
            example: 'vitaminiby',
            description: 'Имя пользователя',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'vitaminiby@ya.ru',
            description: 'Email пользователя',
          },
          firstName: {
            type: 'string',
            example: 'Сергей',
            description: 'Имя пользователя',
          },
          lastName: {
            type: 'string',
            example: 'Гаев',
            description: 'Фамилия пользователя',
          },
          isActive: {
            type: 'boolean',
            example: true,
            description: 'Активен ли пользователь',
          },
          role: {
            type: 'string',
            enum: ['Владелец', 'Администратор', 'Пользователь'],
            example: 'Администратор',
            description: 'Роль пользователя в компании',
          },
          joinedAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-18T21:18:00.000Z',
            description: 'Дата присоединения к компании',
          },
        },
        description: 'Информация о пользователе в компании',
      },
      AddUserResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Пользователь успешно добавлен в компанию',
            description: 'Сообщение об успешном добавлении',
          },
          user: {
            $ref: '#/components/schemas/UserInCompany',
            description: 'Информация о добавленном пользователе',
          },
        },
        description: 'Ответ при успешном добавлении пользователя в компанию',
      },
      InviteUserResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Приглашение отправлено на newuser@example.com. Пользователь получит инструкции для регистрации и присоединения к компании.',
            description: 'Сообщение об отправке приглашения',
          },
          invitationToken: {
            type: 'string',
            example: 'invite_1758219431157_pik53syba',
            description: 'Токен приглашения для регистрации',
          },
          invitationLink: {
            type: 'string',
            example: 'http://localhost:3000/invite/confirm?token=REDACTED_SECRET',
            description: 'Ссылка для подтверждения приглашения и регистрации',
          },
          details: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              role: { type: 'string' },
              companyId: { type: 'string', format: 'uuid' },
              expiresAt: { type: 'string', format: 'date-time' },
            },
            description: 'Детали приглашения',
          },
        },
        description: 'Ответ при успешной отправке приглашения',
      },
      CompanyUsersResponse: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: { $ref: '#/components/schemas/UserInCompany' },
            description: 'Список пользователей компании',
          },
        },
        description: 'Список пользователей компании',
      },
      UpdateUserRoleRequest: {
        type: 'object',
        required: ['role'],
        properties: {
          role: {
            type: 'string',
            enum: ['Администратор', 'Пользователь'],
            example: 'Администратор',
            description: 'Новая роль пользователя в компании',
          },
        },
        description: 'Запрос на изменение роли пользователя',
      },
      VerifyInviteResponse: {
        type: 'object',
        properties: {
          ok: {
            type: 'boolean',
            example: true,
            description: 'Статус проверки токена',
          },
          payload: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email',
                example: 'newuser@example.com',
                description: 'Email приглашенного пользователя',
              },
              companyId: {
                type: 'string',
                format: 'uuid',
                example: '03deb524-dd5d-4a38-b304-29099928ca1d',
                description: 'ID компании',
              },
              role: {
                type: 'string',
                enum: ['Администратор', 'Пользователь'],
                example: 'Пользователь',
                description: 'Роль в компании',
              },
            },
            description: 'Данные приглашения (только при успешной проверке)',
          },
          error: {
            type: 'string',
            example: 'Неверный или истёкший токен приглашения',
            description: 'Сообщение об ошибке (только при неуспешной проверке)',
          },
        },
        description: 'Ответ проверки валидности токена приглашения',
      },

      // ===== CARGO =====
      CreateCargoRequest: {
        type: 'object',
        required: ['id_company','departure_point','arrival_point','id_car_type','id_tip_zagryzki','tonn','m3','payment','date_start','date_end'],
        properties: {
          id_company: { type: 'string', format: 'uuid' },
          departure_point: { type: 'string', example: 'Минск' },
          arrival_point: { type: 'string', example: 'Гродно' },
          id_car_type: { type: 'integer', example: 1 },
          id_tip_zagryzki: { type: 'integer', example: 2 },
          opisanie: { type: 'string', example: 'Нужна перевозка стройматериалов' },
          tonn: { type: 'number', example: 10 },
          m3: { type: 'number', example: 20 },
          price: { type: 'string', example: '1000 BYN' },
          payment: { type: 'string', enum: ['Наличный','Безналичный','Карта','Перевод'] },
          date_start: { type: 'string', format: 'date-time' },
          date_end: { type: 'string', format: 'date-time' },
          irrelevant: { type: 'integer', example: 0 },
          departure_place_id: { type: 'object', additionalProperties: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } } } },
          arrival_place_id: { type: 'object', additionalProperties: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } } } },
          status: { type: 'integer', example: 1 },
        },
      },
      UpdateCargoRequest: { allOf: [ { $ref: '#/components/schemas/CreateCargoRequest' } ] },

      // ===== CARS =====
      CreateCarRequest: {
        type: 'object',
        required: ['id_company','title','id_car_type','id_tip_zagryzki','tonn_min','tonn_max','m3_min','m3_max'],
        properties: {
          id_company: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Тент 20т' },
          id_car_type: { type: 'integer', example: 1 },
          id_tip_zagryzki: { type: 'integer', example: 2 },
          tonn_min: { type: 'number', example: 10 },
          tonn_max: { type: 'number', example: 20 },
          m3_min: { type: 'number', example: 30 },
          m3_max: { type: 'number', example: 60 },
          price: { type: 'number', example: 1500 },
          subscription: { type: 'boolean', example: true },
          search: { type: 'boolean', example: false },
          places: { type: 'object', additionalProperties: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } } } },
        },
      },
      UpdateCarRequest: { allOf: [ { $ref: '#/components/schemas/CreateCarRequest' } ] },
      ToggleCarFlagsRequest: {
        type: 'object',
        properties: {
          subscription: { type: 'boolean' },
          search: { type: 'boolean' },
        },
      },

      // ===== ROUTES =====
      CreateRouteRequest: {
        type: 'object',
        required: ['departure_point','arrival_point'],
        properties: {
          id_cars: { type: 'integer', example: 1 },
          departure_point: { type: 'string', example: 'Минск' },
          arrival_point: { type: 'string', example: 'Брест' },
          places_departure: { type: 'object', additionalProperties: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } } } },
          places_arrival: { type: 'object', additionalProperties: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } } } },
          date_start: { type: 'string', format: 'date-time' },
          opisanie: { type: 'string', example: 'Еду пустой, ищу загрузку по пути' },
        },
      },
      // Для обновления НЕ показываем id_cars в примере, чтобы не путать с id маршрута (id_routes)
      UpdateRouteRequest: {
        type: 'object',
        properties: {
          departure_point: { type: 'string', example: 'Минск' },
          arrival_point: { type: 'string', example: 'Брест' },
          places_departure: { type: 'object', additionalProperties: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } } } },
          places_arrival: { type: 'object', additionalProperties: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } } } },
          date_start: { type: 'string', format: 'date-time' },
          opisanie: { type: 'string', example: 'Еду пустой, ищу загрузку по пути' },
        },
        description: 'Тело запроса для обновления маршрута (без идентификаторов). Идентификатор маршрута передаётся в path как id_routes.',
      },
    },
  },
  paths: {
    '/api/company': {
      post: {
        summary: 'Создать компанию',
        description:
          'Создаёт компанию и привязывает текущего пользователя как «Владельца». Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCompanyRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Компания успешно создана',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    company: { $ref: '#/components/schemas/Company' },
                  },
                },
              },
            },
          },
          '400': { description: 'Некорректные данные запроса', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Требуется авторизация', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Компания с таким УНП уже существует', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      get: {
        summary: 'Список компаний текущего пользователя',
        description: 'Возвращает компании, в которых состоит текущий пользователь. Требуется Authorization: Bearer <token>.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Список компаний пользователя',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    companies: {
                      type: 'array',
                      items: {
                        allOf: [
                          { $ref: '#/components/schemas/Company' },
                          { type: 'object', properties: { role: { type: 'string', enum: ['Владелец','Администратор','Пользователь'] } } },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Требуется авторизация', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register user',
        description:
          'Создаёт нового пользователя: проверяет уникальность username, хеширует пароль и возвращает JWT токен для дальнейших запросов. Поддерживает автоматическое присоединение к компании через inviteToken.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Пользователь успешно создан. Возвращается JWT токен.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': { description: 'Ошибка валидации запроса.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Пользователь с таким username уже существует.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { description: 'Внутренняя ошибка сервера.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login user',
        description: 'Выполняет аутентификацию пользователя и возвращает JWT токен.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Успешный вход. Возвращается JWT токен.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': { description: 'Ошибка валидации запроса.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Неверные учетные данные.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { description: 'Внутренняя ошибка сервера.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Получить текущего пользователя',
        description: 'Возвращает полный объект текущего пользователя по JWT. Требуется Authorization: Bearer <token>.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Пользователь найден', content: { 'application/json': { schema: { $ref: '#/components/schemas/MeResponse' } } } },
          '401': { description: 'Токен отсутствует/просрочен/невалиден', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Пользователь не найден', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    // ====== ГРУЗЫ (Cargo) ======
    '/api/cargo': {
      post: {
        summary: 'Создать груз',
        description: 'Создание карточки груза. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCargoRequest' } } } },
        responses: { '201': { description: 'Груз создан' }, '400': { description: 'Ошибка валидации' }, '401': { description: 'Требуется авторизация' } },
      },
    },
    '/api/cargo/{id}': {
      patch: {
        summary: 'Обновить груз',
        description: 'Редактирование карточки груза по ID. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateCargoRequest' } } } },
        responses: { '200': { description: 'Груз обновлён' }, '400': { description: 'Ошибка валидации' }, '401': { description: 'Требуется авторизация' }, '404': { description: 'Не найдено' } },
      },
      delete: {
        summary: 'Удалить груз',
        description: 'Удаление карточки груза по ID. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Удалено' }, '401': { description: 'Требуется авторизация' }, '404': { description: 'Не найдено' } },
      },
    },
      '/api/cargo/by-company/{companyId}': {
    get: {
      summary: 'Получить все грузы компании',
      description:
        'Возвращает список всех грузов, принадлежащих указанной компании. Требуется авторизация.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'companyId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID компании',
        },
      ],
      responses: {
        '200': { description: 'Список грузов компании' },
        '400': { description: 'Некорректный идентификатор' },
        '401': { description: 'Требуется авторизация' },
        '404': { description: 'Компания не найдена' },
      },
    },
  },
    '/api/cargo/places/search': {
      get: {
        summary: 'Поиск населённых пунктов (грузы)',
        description: 'Подсказки по местам для заполнения формы груза. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' }, description: 'Часть названия' }],
        responses: { '200': { description: 'Ок' }, '401': { description: 'Требуется авторизация' } },
      },
    },
    '/api/cargo/types': {
      get: {
        summary: 'Типы автомобилей (справочник)',
        description: 'Справочник типов ТС для формы груза. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Ок' }, '401': { description: 'Требуется авторизация' } },
      },
    },
    '/api/cargo/load-types': {
      get: {
        summary: 'Типы загрузки (справочник)',
        description: 'Справочник типов загрузки для формы груза. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Ок' }, '401': { description: 'Требуется авторизация' } },
      },
    },

    // ====== АВТОМОБИЛИ (Cars) ======
    '/api/cars': {
      post: {
        summary: 'Создать автомобиль',
        description: 'Создание карточки автомобиля. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCarRequest' } } } },
        responses: { '201': { description: 'Автомобиль создан' }, '400': { description: 'Ошибка валидации' }, '401': { description: 'Требуется авторизация' } },
      },
    },
    '/api/cars/{id}': {
      get: {
        summary: 'Получить автомобиль по ID',
        description: 'Возвращает данные автомобиля по его ID. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID автомобиля' },
        ],
        responses: {
          '200': { description: 'Автомобиль найден' },
          '400': { description: 'Некорректный идентификатор' },
          '401': { description: 'Требуется авторизация' },
          '404': { description: 'Не найдено' },
        },
      },
      patch: {
        summary: 'Обновить автомобиль',
        description: 'Редактирование карточки автомобиля по ID. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateCarRequest' } } } },
        responses: { '200': { description: 'Автомобиль обновлён' }, '400': { description: 'Ошибка валидации' }, '401': { description: 'Требуется авторизация' }, '404': { description: 'Не найдено' } },
      },
      delete: {
        summary: 'Удалить автомобиль',
        description: 'Удаление карточки автомобиля по ID. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Удалено' }, '401': { description: 'Требуется авторизация' }, '404': { description: 'Не найдено' } },
      },
    },
    '/api/cars/by-company': {
      get: {
        summary: 'Список автомобилей компании',
        description: 'Возвращает список автомобилей по ID компании. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id_company', in: 'query', required: true, schema: { type: 'string', format: 'uuid' }, description: 'UUID компании' },
        ],
        responses: {
          '200': { description: 'Список автомобилей компании' },
          '400': { description: 'id_company обязателен' },
          '401': { description: 'Требуется авторизация' },
        },
      },
    },
    '/api/cars/{id}/toggles': {
      patch: {
        summary: 'Переключить флаги подписки/поиска',
        description: 'Изменяет поля subscription/search у автомобиля. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ToggleCarFlagsRequest' } } } },
        responses: { '200': { description: 'Обновлено' }, '400': { description: 'Ошибка валидации' }, '401': { description: 'Требуется авторизация' }, '404': { description: 'Не найдено' } },
      },
    },
    '/api/cars/places/search': {
      get: {
        summary: 'Поиск населённых пунктов (автомобили)',
        description: 'Подсказки по местам для формы автомобиля. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' }, description: 'Часть названия' }],
        responses: { '200': { description: 'Ок' }, '401': { description: 'Требуется авторизация' } },
      },
    },
    '/api/cars/types': {
      get: {
        summary: 'Типы автомобилей (справочник)',
        description: 'Справочник типов ТС для формы автомобиля. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Ок' }, '401': { description: 'Требуется авторизация' } },
      },
    },
    '/api/cars/load-types': {
      get: {
        summary: 'Типы загрузки (справочник)',
        description: 'Справочник типов загрузки для формы автомобиля. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Ок' }, '401': { description: 'Требуется авторизация' } },
      },
    },

    // ====== МАРШРУТЫ (Routes) ======
    '/api/routes': {
      post: {
        summary: 'Создать маршрут',
        description: 'Создание маршрута перевозки. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRouteRequest' } } } },
        responses: { '201': { description: 'Маршрут создан' }, '400': { description: 'Ошибка валидации' }, '401': { description: 'Требуется авторизация' } },
      },
    },
    '/api/routes/{id_routes}': {
      patch: {
        summary: 'Обновить маршрут',
        description: 'Редактирование маршрута по ID. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id_routes', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID маршрута (id_routes)' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateRouteRequest' } } } },
        responses: { '200': { description: 'Маршрут обновлён' }, '400': { description: 'Ошибка валидации' }, '401': { description: 'Требуется авторизация' }, '404': { description: 'Не найдено' } },
      },
      delete: {
        summary: 'Удалить маршрут',
        description: 'Удаление маршрута по ID. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id_routes', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID маршрута (id_routes)' }],
        responses: { '200': { description: 'Удалено' }, '401': { description: 'Требуется авторизация' }, '404': { description: 'Не найдено' } },
      },
    },
    '/api/routes/places/search': {
      get: {
        summary: 'Поиск населённых пунктов (маршруты)',
        description: 'Подсказки по местам для формы маршрута. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' }, description: 'Часть названия' }],
        responses: { '200': { description: 'Ок' }, '401': { description: 'Требуется авторизация' } },
      },
    },
    // ====== NOMINATIM (Places search) ======
    '/api/nominatim/places/search': {
      get: {
        summary: 'Поиск населённых пунктов (Nominatim)',
        description: 'Подсказки по местам через сервис Nominatim. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Часть названия населённого пункта' },
        ],
        responses: {
          '200': { description: 'Ок' },
          '401': { description: 'Требуется авторизация' },
        },
      },
    },
    // ====== CARGO SEARCH (find cargo for a car) ======
    '/api/cargo-search/{id_cars}': {
      get: {
        summary: 'Поиск грузов для автомобиля',
        description: 'Находит подходящие грузы для автомобиля. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id_cars', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID автомобиля' },
        ],
        responses: {
          '200': { description: 'Ок' },
          '400': { description: 'Некорректный идентификатор' },
          '401': { description: 'Требуется авторизация' },
          '404': { description: 'Не найдено' },
        },
      },
    },
      '/api/car-search/{id_cargo}': {
    get: {
      summary: 'Поиск автомобилей для груза',
      description:
        'Находит подходящие автомобили для груза по его массе, объёму и радиусу от пункта отправления. Требуется авторизация.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id_cargo',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'ID груза',
        },
        {
          name: 'radius',
          in: 'query',
          required: false,
          schema: { type: 'integer' },
          description: 'Радиус в километрах (опционально, по умолчанию 50)',
        },
      ],
      responses: {
        '200': { description: 'Ок' },
        '400': { description: 'Некорректный идентификатор' },
        '401': { description: 'Требуется авторизация' },
        '404': { description: 'Не найдено' },
      },
    },
  },
    '/api/profile': {
      get: {
        summary: 'Get current user (example protected route)',
        description:
          'Пример защищённого эндпоинта. Требует заголовок Authorization: Bearer <JWT>. Возвращает расшифрованную полезную нагрузку токена.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Успешный ответ с информацией из JWT.' },
          '401': { description: 'Отсутствует или неверный JWT токен.' },
        },
      },
    },
    // ====== Пользователь (профиль) ======
    '/api/user/me': {
      patch: {
        summary: 'Обновить профиль текущего пользователя',
        description: 'Редактирование email, телефона, имени и фамилии. Требуется авторизация.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  phone: { type: 'string', example: '+375291112233' },
                  firstName: { type: 'string', example: 'Иван' },
                  lastName: { type: 'string', example: 'Иванов' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Профиль обновлён' },
          '400': { description: 'Ошибка валидации' },
          '401': { description: 'Требуется авторизация' },
          '409': { description: 'Email уже используется' },
        },
      },
    },
    // === ENDPOINTS ДЛЯ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ КОМПАНИИ ===
    '/api/company/{companyId}/users': {
      post: {
        summary: 'Добавить существующего пользователя в компанию',
        description: 'Добавляет уже зарегистрированного пользователя в компанию по email. Требует права владельца или администратора компании.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'companyId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            example: '03deb524-dd5d-4a38-b304-29099928ca1d',
            description: 'Уникальный идентификатор компании',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddUserToCompanyRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Пользователь успешно добавлен в компанию',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AddUserResponse' },
              },
            },
          },
          '400': { description: 'Некорректные данные запроса', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Требуется авторизация', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Недостаточно прав для добавления пользователей', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Пользователь с таким email не найден', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Пользователь уже является участником компании', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      get: {
        summary: 'Получить список пользователей компании',
        description: 'Возвращает список всех пользователей компании с их ролями. Доступно всем участникам компании.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'companyId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            example: '03deb524-dd5d-4a38-b304-29099928ca1d',
            description: 'Уникальный идентификатор компании',
          },
        ],
        responses: {
          '200': {
            description: 'Список пользователей компании',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompanyUsersResponse' },
              },
            },
          },
          '401': { description: 'Требуется авторизация', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Нет доступа к этой компании', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/company/{companyId}/invite': {
      post: {
        summary: 'Пригласить пользователя в компанию',
        description: 'Отправляет приглашение новому пользователю для регистрации и присоединения к компании. Требует права владельца или администратора компании.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'companyId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            example: '03deb524-dd5d-4a38-b304-29099928ca1d',
            description: 'Уникальный идентификатор компании',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InviteUserToCompanyRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Приглашение успешно отправлено',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InviteUserResponse' },
              },
            },
          },
          '400': { description: 'Некорректные данные запроса', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Требуется авторизация', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Недостаточно прав для приглашения пользователей', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Пользователь с таким email уже зарегистрирован', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/company/{companyId}/users/{userId}': {
      delete: {
        summary: 'Удалить пользователя из компании',
        description: 'Удаляет пользователя из компании. Требует права владельца или администратора компании. Владелец не может удалить сам себя.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'companyId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            example: '03deb524-dd5d-4a38-b304-29099928ca1d',
            description: 'Уникальный идентификатор компании',
          },
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            example: '5376cc87-5869-46b5-abb1-b7eb909c858d',
            description: 'Уникальный идентификатор пользователя',
          },
        ],
        responses: {
          '200': {
            description: 'Пользователь успешно удален из компании',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Пользователь успешно удален из компании' },
                  },
                },
              },
            },
          },
          '400': { description: 'Владелец не может удалить сам себя', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Требуется авторизация', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Недостаточно прав для удаления пользователей', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Пользователь не найден в этой компании', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/company/{companyId}/users/{userId}/role': {
      put: {
        summary: 'Изменить роль пользователя в компании',
        description: 'Изменяет роль пользователя в компании. Только владелец компании может изменять роли. Владелец не может изменить свою роль.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'companyId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            example: '03deb524-dd5d-4a38-b304-29099928ca1d',
            description: 'Уникальный идентификатор компании',
          },
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            example: '5376cc87-5869-46b5-abb1-b7eb909c858d',
            description: 'Уникальный идентификатор пользователя',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRoleRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Роль пользователя успешно обновлена',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Роль пользователя успешно обновлена' },
                    user: {
                      type: 'object',
                      properties: {
                        id_user: { type: 'string', format: 'uuid' },
                        role: { type: 'string', example: 'Администратор' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Некорректная роль или попытка изменить свою роль', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Требуется авторизация', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Только владелец может изменять роли', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Пользователь не найден в этой компании', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/company/invite/verify': {
      get: {
        summary: 'Проверить валидность токена приглашения',
        description: 'Проверяет валидность JWT токена приглашения и возвращает данные о приглашении (email, companyId, role). Используется перед регистрацией пользователя.',
        parameters: [
          {
            name: 'token',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            example: 'REDACTED_SECRET',
            description: 'JWT токен приглашения',
          },
        ],
        responses: {
          '200': {
            description: 'Токен валиден. Возвращаются данные приглашения.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VerifyInviteResponse' },
              },
            },
          },
          '400': {
            description: 'Токен отсутствует, неверный или истёкший.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VerifyInviteResponse' },
              },
            },
          },
        },
      },
    },
  },
} as const;



