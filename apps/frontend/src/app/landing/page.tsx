import { Metadata } from 'next'
import LandingHero from './components/LandingHero'
import LandingFeatures from './components/LandingFeatures'
import LandingStats from './components/LandingStats'
import LandingContact from './components/LandingContact'
import './landing.module.css'

export const metadata: Metadata = {
  title: 'Крупнейшая международная Биржа грузоперевозок ATI.SU',
  description: 'Помогает перевозчикам и грузоотправителям из Беларуси, России и ещё 60 стран найти друг друга и договориться о перевозке.',
  openGraph: {
    title: 'Крупнейшая международная Биржа грузоперевозок ATI.SU',
    description: 'Помогает перевозчикам и грузоотправителям из Беларуси, России и ещё 60 стран найти друг друга и договориться о перевозке.',
    type: 'website',
    url: 'https://ati.su/landings/cargo-by/',
    images: [
      {
        url: 'tild3938-3533-4330-b536-663266623338__atisu_.png',
        width: 1200,
        height: 630,
        alt: 'ATI.SU - Биржа грузоперевозок',
      },
    ],
  },
  alternates: {
    canonical: 'https://ati.su/landings/cargo-by/',
  },
}

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <LandingHero />
      
      {/* Features Section */}
      <LandingFeatures />
      
      {/* Stats Section */}
      <LandingStats />
      
      {/* Contact Section */}
      <LandingContact />
      
      {/* Chat Widget */}
      <div id="chat-widget-wrapper" className="fixed bottom-5 right-5 z-50 w-15 h-15">
        <div id="chat-widget-btn" aria-hidden="true"></div>
        <div 
          id="chat-widget-top" 
          aria-label="messenger-widget"
          className="absolute bottom-0 right-0 w-15 h-15 bg-blue-600 text-white text-2xl leading-14 text-center cursor-pointer select-none transition-colors duration-300 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg chat-widget"
        >
          <svg width="24" height="24" viewBox="0 0 22 22" x="5" y="5">
            <use xlinkHref="#ic_message-solid" href="#ic_message-solid" fill="#fff"></use>
          </svg>
        </div>
        <a 
          className="absolute bottom-0 right-0 w-11 h-11 bg-no-repeat bg-center bg-cover opacity-0 transform scale-0 transition-all duration-500 hover:scale-100"
          href="https://wa.me/375447999595" 
          target="_blank" 
          rel="noopener"
          style={{ backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE3.472IDYuMDAwMDFIMTguOTkyVjIuNDAwMDFIMTcuNDcyVjYuMDAwMDFaIiBmaWxsPSIjMjVEMzQ1Ii8+CjxwYXRoIGQ9Ik0xMi4wMDggMEM1LjM3MiAwIDAgNS4zNzIgMCAxMi4wMDhDMCAxNC4yNzIgMC43MiAxNi4zNiAyLjAwOCAxOC4xMjhMMCAyNEw2LjAwOCAyMi4wMTZDNy43NjggMjMuMzI4IDkuODY0IDI0IDEyLjAwOCAyNEMxOC42NDggMjQgMjQuMDE2IDE4LjYzMiAyNC4wMTYgMTIuMDA4QzI0LjAxNiA1LjM3MiAxOC42NDggMCAxMi4wMDggMFpNMTIuMDA4IDIxLjAwOEMxMC4wODggMjEuMDA4IDguMzEyIDIwLjQ0OCA2Ljg5NiAxOS40ODhMMi4wMDggMjEuNDQ4TDMuOTY4IDE2LjU2QzMuMDA4IDE1LjE0NCAyLjQ0OCAxMy4zNjggMi40NDggMTEuNDQ4QzIuNDQ4IDYuNzIgNi4yODggMi44OCAxMi4wMDggMi44OEMxNy43MjggMi44OCAyMS41NjggNi43MiAyMS41NjggMTEuNDQ4QzIxLjU2OCAxNi4xNzYgMTcuNzI4IDIxLjAwOCAxMi4wMDggMjEuMDA4WiIgZmlsbD0iIzI1RDM0NSIvPgo8L3N2Zz4K)' }}
        >
        </a>
        <a 
          className="absolute bottom-0 right-0 w-11 h-11 bg-no-repeat bg-center bg-cover opacity-0 transform scale-0 transition-all duration-500 hover:scale-100"
          href="viber://chat?number=%2B375447999595"
          style={{ backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDBDNS4zNzMgMCAwIDUuMzczIDAgMTJTNS4zNzMgMjQgMTIgMjRTMjQgMTguNjI3IDI0IDEyUzE4LjYyNyAwIDEyIDBaTTEyIDIyQzYuNDc3IDIyIDIgMTcuNTIzIDIgMTJTNi40NzcgMiAxMiAyUzIyIDYuNDc3IDIyIDEyUzE3LjUyMyAyMiAxMiAyMloiIGZpbGw9IiM2NjVDRUEiLz4KPC9zdmc+Cg==)' }}
        >
        </a>
        <a 
          className="absolute bottom-0 right-0 w-11 h-11 bg-no-repeat bg-center bg-cover opacity-0 transform scale-0 transition-all duration-500 hover:scale-100"
          href="https://t.me/ATISU_Belarus" 
          target="_blank" 
          rel="noopener"
          style={{ backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDBDNS4zNzMgMCAwIDUuMzczIDAgMTJTNS4zNzMgMjQgMTIgMjRTMjQgMTguNjI3IDI0IDEyUzE4LjYyNyAwIDEyIDBaTTE3LjY2IDE1LjU0TDE2LjI0IDE5LjY0QzE2LjEyIDE5Ljk2IDE1LjgyIDIwLjA4IDE1LjU0IDE5Ljk0TDEyLjY2IDE3LjgyTDEwLjkyIDE5LjU2QzEwLjY4IDE5LjggMTAuNDggMTkuOTYgMTAuMzIgMTkuOTZIMTAuM0wxMC4xMiAxOS45MkM5Ljk2IDE5Ljg4IDkuODggMTkuNjggOS45MiAxOS40OEwxMC42IDE1LjQ4TDE3LjY2IDE4LjQ2QzE3Ljk0IDE4LjU4IDE4LjA2IDE4Ljg4IDE3Ljk0IDE5LjE2QzE3LjgyIDE5LjQ0IDE3LjUyIDE5LjU2IDE3LjI0IDE5LjQ0TDE3LjY2IDE1LjU0WiIgZmlsbD0iIzAwOEFGRiIvPgo8L3N2Zz4K)' }}
        >
        </a>
      </div>
    </main>
  )
}
