import Image from 'next/image'

export default function LandingHero() {
  return (
    <section className="relative min-h-screen bg-gradient-to-b from-black/75 to-black/30">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('tild6636-6530-4462-b961-326462333865__pic-f.png')"
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 to-black/30" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="text-center text-white max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Крупнейшая международная<br />
            Биржа грузоперевозок ATI.SU
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Помогает перевозчикам и грузоотправителям из Беларуси, России и ещё 60 стран 
            найти друг друга и договориться о перевозке.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary text-white px-8 py-4 rounded-lg text-lg font-semibold">
              Найти груз
            </button>
            <button className="btn-secondary text-white px-8 py-4 rounded-lg text-lg font-semibold">
              Найти машину
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
