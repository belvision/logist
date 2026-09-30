interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  faqs: FAQItem[];
}

export const FAQ = ({ faqs }: FAQProps) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
};

export const commonFAQs: FAQItem[] = [
  {
    question: "Что такое LogistGo.pro?",
    answer: "LogistGo.pro - это международная биржа грузоперевозок, которая помогает перевозчикам и грузоотправителям из Беларуси, России, Казахстана, Польши, Литвы найти друг друга и договориться о перевозке."
  },
  {
    question: "Сколько стоит регистрация на LogistGo.pro?",
    answer: "Регистрация на LogistGo.pro полностью бесплатна. Вы можете бесплатно добавлять транспорт, искать грузы и откликаться на заказы."
  },
  {
    question: "Какие страны поддерживает LogistGo.pro?",
    answer: "Мы работаем с перевозчиками и грузоотправителями из Беларуси, России, Казахстана, Польши и Литвы."
  },
  {
    question: "Как начать работать перевозчиком на LogistGo.pro?",
    answer: "Зарегистрируйтесь, добавьте информацию о вашем транспорте, укажите регионы работы и начните получать уведомления о подходящих грузах."
  },
  {
    question: "Как найти перевозчика для моего груза?",
    answer: "Зарегистрируйтесь как грузовладелец, добавьте информацию о грузе, и перевозчики сами найдут вас и предложат свои услуги."
  },
  {
    question: "Есть ли Telegram бот LogistGo.pro?",
    answer: "Да, у нас есть Telegram бот @logistgoBot, который позволяет работать с платформой в любом месте."
  }
];
