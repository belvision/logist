// Данные о странах для лендингов

export interface CountryData {
  code: string; // ISO код страны
  slug: string; // URL slug
  nameRu: string; // Название на русском
  nameLocal?: string; // Название на местном языке
  flag: string; // Эмодзи флага
  languages: string[]; // Языки страницы
  description: {
    ru: string;
    local?: string;
  };
  keywords: string[];
  content: {
    hero: {
      title: {
        ru: string;
        local?: string;
      };
      subtitle: {
        ru: string;
        local?: string;
      };
    };
    features: {
      title: {
        ru: string;
        local?: string;
      };
      items: Array<{
        title: { ru: string; local?: string };
        description: { ru: string; local?: string };
      }>;
    };
  };
}

export const countries: CountryData[] = [
  {
    code: 'BY',
    slug: 'belarus',
    nameRu: 'Беларусь',
    flag: '🇧🇾',
    languages: ['ru'],
    description: {
      ru: 'Международная биржа грузоперевозок LogistGo.pro в Беларуси. Поиск перевозчиков и грузов, добавление транспорта бесплатно. Надежная логистическая платформа для белорусских перевозчиков и грузовладельцев.',
    },
    keywords: ['грузоперевозки Беларусь', 'перевозчики Минск', 'биржа грузов Беларусь', 'логистика Беларусь', 'транспортная биржа BY'],
    content: {
      hero: {
        title: {
          ru: 'Биржа грузоперевозок в Беларуси',
        },
        subtitle: {
          ru: 'Найдите надежных перевозчиков и выгодные грузы в Беларуси. Бесплатная регистрация на LogistGo.pro',
        },
      },
      features: {
        title: {
          ru: 'Преимущества работы в Беларуси',
        },
        items: [
          {
            title: { ru: 'Местные перевозчики' },
            description: { ru: 'Тысячи белорусских перевозчиков готовы выполнить ваш заказ' },
          },
          {
            title: { ru: 'Быстрая доставка' },
            description: { ru: 'Перевозки по Беларуси и международные маршруты' },
          },
          {
            title: { ru: 'Надежная платформа' },
            description: { ru: 'Проверка участников, рейтинговая система, безопасные сделки' },
          },
        ],
      },
    },
  },
  {
    code: 'RU',
    slug: 'russia',
    nameRu: 'Россия',
    flag: '🇷🇺',
    languages: ['ru'],
    description: {
      ru: 'Международная биржа грузоперевозок LogistGo.pro в России. Поиск перевозчиков и грузов по всей России, добавление транспорта бесплатно. Крупнейшая логистическая платформа для российских перевозчиков.',
    },
    keywords: ['грузоперевозки Россия', 'перевозчики Москва', 'биржа грузов Россия', 'логистика РФ', 'транспортная биржа России'],
    content: {
      hero: {
        title: {
          ru: 'Биржа грузоперевозок в России',
        },
        subtitle: {
          ru: 'Найдите надежных перевозчиков и выгодные грузы по всей России. Бесплатная регистрация на LogistGo.pro',
        },
      },
      features: {
        title: {
          ru: 'Преимущества работы в России',
        },
        items: [
          {
            title: { ru: 'Вся Россия' },
            description: { ru: 'Перевозки от Калининграда до Владивостока' },
          },
          {
            title: { ru: 'Крупнейшая база' },
            description: { ru: 'Тысячи российских перевозчиков и грузовладельцев' },
          },
          {
            title: { ru: 'Международные маршруты' },
            description: { ru: 'Перевозки в страны СНГ, Европу и Азию' },
          },
        ],
      },
    },
  },
  {
    code: 'KZ',
    slug: 'kazakhstan',
    nameRu: 'Казахстан',
    nameLocal: 'Қазақстан',
    flag: '🇰🇿',
    languages: ['ru', 'kk'],
    description: {
      ru: 'Международная биржа грузоперевозок LogistGo.pro в Казахстане. Поиск перевозчиков и грузов, добавление транспорта бесплатно. Логистическая платформа для казахстанских перевозчиков и грузовладельцев.',
      local: 'LogistGo.pro халықаралық жүк тасымалдау биржасы Қазақстанда. Тасымалдаушылар мен жүктерді іздеу, көлікті тегін қосу.',
    },
    keywords: ['грузоперевозки Казахстан', 'перевозчики Алматы', 'биржа грузов Казахстан', 'логистика Астана', 'жүк тасымалы Қазақстан'],
    content: {
      hero: {
        title: {
          ru: 'Биржа грузоперевозок в Казахстане',
          local: 'Қазақстандағы жүк тасымалдау биржасы',
        },
        subtitle: {
          ru: 'Найдите надежных перевозчиков и выгодные грузы в Казахстане. Бесплатная регистрация на LogistGo.pro',
          local: 'Қазақстанда сенімді тасымалдаушылар мен тиімді жүктерді табыңыз. LogistGo.pro-да тегін тіркелу',
        },
      },
      features: {
        title: {
          ru: 'Преимущества работы в Казахстане',
          local: 'Қазақстанда жұмыс істеудің артықшылықтары',
        },
        items: [
          {
            title: { ru: 'Местные перевозчики', local: 'Жергілікті тасымалдаушылар' },
            description: { ru: 'Казахстанские перевозчики готовы выполнить ваш заказ', local: 'Қазақстандық тасымалдаушылар сіздің тапсырысыңызды орындауға дайын' },
          },
          {
            title: { ru: 'Международные маршруты', local: 'Халықаралық бағыттар' },
            description: { ru: 'Перевозки по Казахстану и в страны ЕАЭС', local: 'Қазақстан бойынша және ЕАЭО елдеріне тасымалдау' },
          },
          {
            title: { ru: 'Надежная платформа', local: 'Сенімді платформа' },
            description: { ru: 'Проверка участников и безопасные сделки', local: 'Қатысушыларды тексеру және қауіпсіз мәмілелер' },
          },
        ],
      },
    },
  },
  {
    code: 'PL',
    slug: 'poland',
    nameRu: 'Польша',
    nameLocal: 'Polska',
    flag: '🇵🇱',
    languages: ['ru', 'pl'],
    description: {
      ru: 'Международная биржа грузоперевозок LogistGo.pro в Польше. Поиск перевозчиков и грузов, добавление транспорта бесплатно. Логистическая платформа для польских и международных перевозок.',
      local: 'Międzynarodowa giełda transportowa LogistGo.pro w Polsce. Wyszukiwanie przewoźników i ładunków, dodawanie transportu za darmo.',
    },
    keywords: ['грузоперевозки Польша', 'перевозчики Варшава', 'биржа грузов Польша', 'transport Polska', 'giełda transportowa'],
    content: {
      hero: {
        title: {
          ru: 'Биржа грузоперевозок в Польше',
          local: 'Giełda transportowa w Polsce',
        },
        subtitle: {
          ru: 'Найдите надежных перевозчиков и выгодные грузы в Польше. Бесплатная регистрация на LogistGo.pro',
          local: 'Znajdź wiarygodnych przewoźników i opłacalne ładunki w Polsce. Bezpłatna rejestracja na LogistGo.pro',
        },
      },
      features: {
        title: {
          ru: 'Преимущества работы в Польше',
          local: 'Zalety pracy w Polsce',
        },
        items: [
          {
            title: { ru: 'Европейские стандарты', local: 'Standardy europejskie' },
            description: { ru: 'Работа по европейским стандартам качества', local: 'Praca zgodnie z europejskimi standardami jakości' },
          },
          {
            title: { ru: 'Международные перевозки', local: 'Transport międzynarodowy' },
            description: { ru: 'Перевозки по Европе и в страны СНГ', local: 'Transport po Europie i do krajów WNP' },
          },
          {
            title: { ru: 'Надежная платформа', local: 'Niezawodna platforma' },
            description: { ru: 'Проверенные перевозчики и безопасные сделки', local: 'Zweryfikowani przewoźnicy i bezpieczne transakcje' },
          },
        ],
      },
    },
  },
  {
    code: 'LT',
    slug: 'lithuania',
    nameRu: 'Литва',
    nameLocal: 'Lietuva',
    flag: '🇱🇹',
    languages: ['ru', 'lt'],
    description: {
      ru: 'Международная биржа грузоперевозок LogistGo.pro в Литве. Поиск перевозчиков и грузов, добавление транспорта бесплатно. Логистическая платформа для литовских и международных перевозок.',
      local: 'Tarptautinė krovinių vežimo birža LogistGo.pro Lietuvoje. Vežėjų ir krovinių paieška, transporto pridėjimas nemokamai.',
    },
    keywords: ['грузоперевозки Литва', 'перевозчики Вильнюс', 'биржа грузов Литва', 'krovinių pervežimas Lietuva', 'transporto birža'],
    content: {
      hero: {
        title: {
          ru: 'Биржа грузоперевозок в Литве',
          local: 'Krovinių vežimo birža Lietuvoje',
        },
        subtitle: {
          ru: 'Найдите надежных перевозчиков и выгодные грузы в Литве. Бесплатная регистрация на LogistGo.pro',
          local: 'Raskite patikimus vežėjus ir pelningus krovinius Lietuvoje. Nemokama registracija LogistGo.pro',
        },
      },
      features: {
        title: {
          ru: 'Преимущества работы в Литве',
          local: 'Darbo Lietuvoje pranašumai',
        },
        items: [
          {
            title: { ru: 'Балтийский хаб', local: 'Baltijos centras' },
            description: { ru: 'Стратегическое расположение для перевозок', local: 'Strateginė vieta pervežimams' },
          },
          {
            title: { ru: 'Европейские маршруты', local: 'Europos maršrutai' },
            description: { ru: 'Перевозки по Балтии и всей Европе', local: 'Pervežimai Baltijos šalyse ir visoje Europoje' },
          },
          {
            title: { ru: 'Профессионалы', local: 'Profesionalai' },
            description: { ru: 'Опытные литовские перевозчики', local: 'Patyrę Lietuvos vežėjai' },
          },
        ],
      },
    },
  },
  {
    code: 'UZ',
    slug: 'uzbekistan',
    nameRu: 'Узбекистан',
    nameLocal: 'O\'zbekiston',
    flag: '🇺🇿',
    languages: ['ru', 'uz'],
    description: {
      ru: 'Международная биржа грузоперевозок LogistGo.pro в Узбекистане. Поиск перевозчиков и грузов, добавление транспорта бесплатно. Логистическая платформа для узбекских перевозчиков и грузовладельцев.',
      local: 'LogistGo.pro xalqaro yuk tashish birjasi O\'zbekistonda. Tashuvchilar va yuklarni qidirish, transportni bepul qo\'shish.',
    },
    keywords: ['грузоперевозки Узбекистан', 'перевозчики Ташкент', 'биржа грузов Узбекистан', 'yuk tashish O\'zbekiston', 'логистика Самарканд'],
    content: {
      hero: {
        title: {
          ru: 'Биржа грузоперевозок в Узбекистане',
          local: 'O\'zbekistonda yuk tashish birjasi',
        },
        subtitle: {
          ru: 'Найдите надежных перевозчиков и выгодные грузы в Узбекистане. Бесплатная регистрация на LogistGo.pro',
          local: 'O\'zbekistonda ishonchli tashuvchilar va foydali yuklarni toping. LogistGo.pro-da bepul ro\'yxatdan o\'tish',
        },
      },
      features: {
        title: {
          ru: 'Преимущества работы в Узбекистане',
          local: 'O\'zbekistonda ishlashning afzalliklari',
        },
        items: [
          {
            title: { ru: 'Центральная Азия', local: 'Markaziy Osiyo' },
            description: { ru: 'Ключевая логистическая точка региона', local: 'Mintaqaning asosiy logistika nuqtasi' },
          },
          {
            title: { ru: 'Местные перевозчики', local: 'Mahalliy tashuvchilar' },
            description: { ru: 'Узбекские перевозчики знают все маршруты', local: 'O\'zbek tashuvchilari barcha marshrutlarni biladi' },
          },
          {
            title: { ru: 'Международные маршруты', local: 'Xalqaro yo\'nalishlar' },
            description: { ru: 'Перевозки в страны СНГ и Китай', local: 'MDH mamlakatlari va Xitoyga tashish' },
          },
        ],
      },
    },
  },
  {
    code: 'TJ',
    slug: 'tajikistan',
    nameRu: 'Таджикистан',
    nameLocal: 'Тоҷикистон',
    flag: '🇹🇯',
    languages: ['ru', 'tg'],
    description: {
      ru: 'Международная биржа грузоперевозок LogistGo.pro в Таджикистане. Поиск перевозчиков и грузов, добавление транспорта бесплатно. Логистическая платформа для таджикских перевозчиков и грузовладельцев.',
      local: 'Биржаи байналмилалии ҳамлу нақли бор LogistGo.pro дар Тоҷикистон. Ҷустуҷӯи ҳамлкунандагон ва борҳо, илова кардани транспорт ройгон.',
    },
    keywords: ['грузоперевозки Таджикистан', 'перевозчики Душанбе', 'биржа грузов Таджикистан', 'ҳамли бор Тоҷикистон', 'логистика Худжанд'],
    content: {
      hero: {
        title: {
          ru: 'Биржа грузоперевозок в Таджикистане',
          local: 'Биржаи ҳамли бор дар Тоҷикистон',
        },
        subtitle: {
          ru: 'Найдите надежных перевозчиков и выгодные грузы в Таджикистане. Бесплатная регистрация на LogistGo.pro',
          local: 'Дар Тоҷикистон ҳамлкунандагони боэътимод ва борҳои судманд ёбед. Бақайдгирии ройгон дар LogistGo.pro',
        },
      },
      features: {
        title: {
          ru: 'Преимущества работы в Таджикистане',
          local: 'Бартариҳои кор дар Тоҷикистон',
        },
        items: [
          {
            title: { ru: 'Горные маршруты', local: 'Роҳҳои кӯҳӣ' },
            description: { ru: 'Специализированные перевозки в горных условиях', local: 'Ҳамли махсус дар шароити кӯҳӣ' },
          },
          {
            title: { ru: 'Опытные водители', local: 'Ронандагони ботаҷриба' },
            description: { ru: 'Таджикские водители знают сложные маршруты', local: 'Ронандагони тоҷик роҳҳои мушкилро медонанд' },
          },
          {
            title: { ru: 'Региональные перевозки', local: 'Ҳамли минтақавӣ' },
            description: { ru: 'Связь с Узбекистаном, Кыргызстаном, Китаем', local: 'Пайванд бо Ӯзбекистон, Қирғизистон, Чин' },
          },
        ],
      },
    },
  },
  {
    code: 'TR',
    slug: 'turkey',
    nameRu: 'Турция',
    nameLocal: 'Türkiye',
    flag: '🇹🇷',
    languages: ['ru', 'tr'],
    description: {
      ru: 'Международная биржа грузоперевозок LogistGo.pro в Турции. Поиск перевозчиков и грузов, добавление транспорта бесплатно. Логистическая платформа для турецких и международных перевозок.',
      local: 'LogistGo.pro Türkiye\'de uluslararası yük taşıma borsası. Taşıyıcı ve yük arama, ücretsiz araç ekleme.',
    },
    keywords: ['грузоперевозки Турция', 'перевозчики Стамбул', 'биржа грузов Турция', 'nakliye Türkiye', 'taşımacılık İstanbul'],
    content: {
      hero: {
        title: {
          ru: 'Биржа грузоперевозок в Турции',
          local: 'Türkiye\'de yük taşıma borsası',
        },
        subtitle: {
          ru: 'Найдите надежных перевозчиков и выгодные грузы в Турции. Бесплатная регистрация на LogistGo.pro',
          local: 'Türkiye\'de güvenilir taşıyıcılar ve karlı yükler bulun. LogistGo.pro\'da ücretsiz kayıt',
        },
      },
      features: {
        title: {
          ru: 'Преимущества работы в Турции',
          local: 'Türkiye\'de çalışmanın avantajları',
        },
        items: [
          {
            title: { ru: 'Мост между Европой и Азией', local: 'Avrupa ve Asya arasında köprü' },
            description: { ru: 'Стратегическое расположение для транзита', local: 'Transit için stratejik konum' },
          },
          {
            title: { ru: 'Развитая логистика', local: 'Gelişmiş lojistik' },
            description: { ru: 'Современная инфраструктура и опытные перевозчики', local: 'Modern altyapı ve deneyimli taşıyıcılar' },
          },
          {
            title: { ru: 'Международные маршруты', local: 'Uluslararası rotalar' },
            description: { ru: 'Перевозки в Европу, СНГ и Ближний Восток', local: 'Avrupa, BDT ve Orta Doğu\'ya taşıma' },
          },
        ],
      },
    },
  },
  {
    code: 'GE',
    slug: 'georgia',
    nameRu: 'Грузия',
    nameLocal: 'საქართველო',
    flag: '🇬🇪',
    languages: ['ru', 'ka'],
    description: {
      ru: 'Международная биржа грузоперевозок LogistGo.pro в Грузии. Поиск перевозчиков и грузов, добавление транспорта бесплатно. Логистическая платформа для грузинских перевозчиков и грузовладельцев.',
      local: 'LogistGo.pro საერთაშორისო სატვირთო გადაზიდვების ბირჟა საქართველოში. გადამზიდავებისა და ტვირთების ძებნა, ტრანსპორტის უფასო დამატება.',
    },
    keywords: ['грузоперевозки Грузия', 'перевозчики Тбилиси', 'биржа грузов Грузия', 'ტვირთის გადაზიდვა საქართველო', 'логистика Батуми'],
    content: {
      hero: {
        title: {
          ru: 'Биржа грузоперевозок в Грузии',
          local: 'სატვირთო გადაზიდვების ბირჟა საქართველოში',
        },
        subtitle: {
          ru: 'Найдите надежных перевозчиков и выгодные грузы в Грузии. Бесплатная регистрация на LogistGo.pro',
          local: 'იპოვეთ სანდო გადამზიდავები და მომგებიანი ტვირთები საქართველოში. უფასო რეგისტრაცია LogistGo.pro-ზე',
        },
      },
      features: {
        title: {
          ru: 'Преимущества работы в Грузии',
          local: 'საქართველოში მუშაობის უპირატესობები',
        },
        items: [
          {
            title: { ru: 'Кавказский коридор', local: 'კავკასიური კორიდორი' },
            description: { ru: 'Важный транзитный маршрут между Европой и Азией', local: 'მნიშვნელოვანი სატრანზიტო მარშრუტი ევროპასა და აზიას შორის' },
          },
          {
            title: { ru: 'Морские порты', local: 'ზღვის პორტები' },
            description: { ru: 'Батуми и Поти - ворота в регион', local: 'ბათუმი და ფოთი - რეგიონის კარიბჭე' },
          },
          {
            title: { ru: 'Опытные перевозчики', local: 'გამოცდილი გადამზიდავები' },
            description: { ru: 'Грузинские перевозчики работают по всему Кавказу', local: 'ქართველი გადამზიდავები მუშაობენ მთელ კავკასიაში' },
          },
        ],
      },
    },
  },
];

// Получить данные страны по slug
export function getCountryBySlug(slug: string): CountryData | undefined {
  return countries.find(c => c.slug === slug);
}

// Получить все страны
export function getAllCountries(): CountryData[] {
  return countries;
}

// Получить список slug для генерации статических страниц
export function getCountrySlugs(): string[] {
  return countries.map(c => c.slug);
}

