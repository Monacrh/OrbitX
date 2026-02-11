'use client'

import { Play, Pause, Calendar, Gauge, FastForward, Rewind } from 'lucide-react'

interface SolarControlsProps {
  isAligned: boolean
  onToggle: () => void
  currentDate: Date
  speed: number
  onSpeedChange: (value: number) => void
}

export function SolarControls({ isAligned, onToggle, currentDate, speed, onSpeedChange }: SolarControlsProps) {
  // Format tanggal: "23 Jan 2026"
  const dateString = currentDate.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
      {/* Container Utama dengan efek Glass */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl transition-all hover:border-white/20 hover:shadow-blue-500/10">
        
        {/* Hiasan Garis Atas */}
        <div className={`absolute top-0 left-0 h-[2px] w-full transition-all duration-1000 ${!isAligned ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 opacity-100' : 'bg-white/10 opacity-50'}`} />

        <div className="flex flex-col p-4 gap-4">
          
          {/* BARIS ATAS: Info & Tombol Play */}
          <div className="flex items-center justify-between">
            {/* KIRI: Info Waktu */}
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${!isAligned ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                  Mission Time
                </span>
                <span className="font-mono text-lg font-bold text-white tracking-wide">
                  {dateString}
                </span>
              </div>
            </div>

            {/* KANAN: Tombol Kontrol */}
            <button
              onClick={onToggle}
              className={`
                group relative flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all duration-300
                ${isAligned 
                  ? 'bg-white text-black hover:bg-blue-50 hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                }
              `}
            >
              {isAligned ? (
                <>
                  <Play className="h-4 w-4 fill-current transition-transform group-hover:translate-x-0.5" />
                  <span>START</span>
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 fill-current" />
                  <span>PAUSE</span>
                </>
              )}
            </button>
          </div>

          {/* BARIS BAWAH: Slider Kecepatan */}
          {/* Hanya muncul jika sedang tidak PAUSE (isAligned = false) atau kita biarkan selalu muncul agar user bisa set speed sebelum start */}
          <div className="flex items-center gap-4 pt-2 border-t border-white/5">
            
            {/* Ikon Speed */}
            <div className="flex items-center gap-2 min-w-[60px]">
                <Gauge className="h-4 w-4 text-blue-400" />
                <span className="font-mono text-xs text-blue-300 font-bold">
                    {speed.toFixed(1)}x
                </span>
            </div>

            {/* Slider */}
            <div className="relative flex-1 flex items-center group">
                <Rewind className="absolute left-0 h-3 w-3 text-white/20" />
                
                <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={speed}
                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-none z-10 mx-6"
                />
                
                <FastForward className="absolute right-0 h-3 w-3 text-white/20" />
            </div>

            <div className="text-[10px] text-white/30 font-mono tracking-widest uppercase hidden sm:block">
                Warp Speed
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}