export default function LandingFeatures() {
  const features = [
    {
      title: "Быстрый поиск",
      description: "Найдите подходящий груз или транспорт за несколько минут",
      icon: "🔍"
    },
    {
      title: "Проверенные перевозчики",
      description: "Работайте только с надежными партнерами",
      icon: "✅"
    },
    {
      title: "Безопасные сделки",
      description: "Гарантированная оплата и страхование грузов",
      icon: "🛡️"
    },
    {
      title: "Поддержка 24/7",
      description: "Наша команда всегда готова помочь",
      icon: "📞"
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Почему выбирают ATI.SU?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Мы создали платформу, которая объединяет тысячи перевозчиков и грузоотправителей по всему миру
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 rounded-lg feature-card">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
