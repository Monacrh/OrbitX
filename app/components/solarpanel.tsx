'use client'

import { Play, Pause, Calendar, Clock, Activity } from 'lucide-react'

interface SolarControlsProps {
  isAligned: boolean
  onToggle: () => void
  currentDate: Date
}

export function SolarControls({ isAligned, onToggle, currentDate }: SolarControlsProps) {
  // Format tanggal: "23 Jan 2026"
  const dateString = currentDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  // Format jam (simulasi): Kita ambil jam asli saja untuk variasi visual
  const timeString = currentDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      {/* Container Utama dengan efek Glass */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl transition-all hover:border-white/20 hover:shadow-blue-500/10">
        
        {/* Hiasan Garis Atas (Progress Bar like) */}
        <div className={`absolute top-0 left-0 h-[2px] w-full transition-all duration-1000 ${!isAligned ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 opacity-100' : 'bg-white/10 opacity-50'}`} />

        <div className="flex items-center justify-between p-1">
          
          {/* BAGIAN KIRI: Info Data */}
          <div className="flex items-center gap-4 px-4 py-2">
            
            {/* Ikon Kalender */}
            <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${!isAligned ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
              <Calendar className="h-5 w-5" />
            </div>

            {/* Teks Tanggal & Status */}
            <div className="flex flex-col">
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                Mission Time
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-white tracking-wide">
                  {dateString}
                </span>
                {/* Indikator Berkedip */}
                {!isAligned && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* BAGIAN KANAN: Tombol Kontrol */}
          <button
            onClick={onToggle}
            className={`
              group relative flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-300
              ${isAligned 
                ? 'bg-white text-black hover:bg-blue-50 hover:scale-105' // Style tombol Play
                : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40' // Style tombol Stop
              }
            `}
          >
            {isAligned ? (
              <>
                <Play className="h-4 w-4 fill-current transition-transform group-hover:translate-x-0.5" />
                <span>MULAI</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>PAUSE</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Label Bawah (Opsional) */}
      <div className="mt-2 text-center">
        <p className="text-[10px] text-white/20 font-mono tracking-widest">ORBITX SYSTEM v1.0</p>
      </div>
    </div>
  )
}