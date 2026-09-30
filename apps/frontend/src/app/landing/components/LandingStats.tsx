export default function LandingStats() {
  const stats = [
    {
      number: "60+",
      label: "Стран",
      description: "Представлены на нашей платформе"
    },
    {
      number: "500K+",
      label: "Пользователей",
      description: "Активных участников сообщества"
    },
    {
      number: "1M+",
      label: "Грузов",
      description: "Обработано за все время"
    },
    {
      number: "99%",
      label: "Успешных сделок",
      description: "Довольных клиентов"
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ATI.SU в цифрах
          </h2>
          <p className="text-xl text-gray-600">
            Статистика, которая говорит сама за себя
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl font-bold stat-number mb-2">
                {stat.number}
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-2">
                {stat.label}
              </div>
              <div className="text-gray-600">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
