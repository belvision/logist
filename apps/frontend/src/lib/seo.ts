export const seoConfig = {
  siteName: 'LogistGo.pro',
  siteUrl: 'https://logistgo.pro',
  defaultTitle: 'LogistGo.pro - Международная биржа грузоперевозок',
  defaultDescription: 'Международная биржа грузоперевозок LogistGo.pro. Помогает перевозчикам и грузоотправителям из Беларуси, России, Казахстана, Польши, Литвы найти друг друга и договориться о перевозке. Бесплатная регистрация.',
  defaultKeywords: [
    'грузоперевозки',
    'биржа грузоперевозок', 
    'перевозчики',
    'грузоотправители',
    'Беларусь',
    'Россия',
    'Казахстан',
    'Польша',
    'Литва',
    'логистика',
    'транспорт',
    'грузы',
    'международные перевозки',
    'поиск грузов',
    'поиск перевозчиков'
  ],
  social: {
    twitter: '@logistgo_pro',
    facebook: 'logistgo.pro',
    instagram: 'logistgo_pro',
    telegram: 'logistgoBot',
    vk: 'logistgo_pro'
  },
  contact: {
    email: '5730844@gmail.com',
    phone: '+375 29 573 08 44',
    address: 'Беларусь'
  }
};

export const generatePageTitle = (title: string, includeSiteName = true) => {
  return includeSiteName ? `${title} | ${seoConfig.siteName}` : title;
};

export const generatePageDescription = (description: string) => {
  return `${description} ${seoConfig.defaultDescription}`;
};

export const generateStructuredData = (type: string, data: Record<string, unknown>) => {
  return {
    "@context": "https://schema.org",
    "@type": type,
    ...data
  };
};
