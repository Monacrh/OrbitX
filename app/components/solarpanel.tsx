'use client'

import { format } from 'date-fns' // Opsional: jika mau format tanggal cantik, tapi kita pakai native JS saja biar ringan
import { Play, Pause, CalendarDays } from 'lucide-react' // Kita pakai icon biar keren (pastikan install lucide-react)

interface SolarControlsProps {
  isAligned: boolean
  onToggle: () => void
  currentDate: Date
}

export function SolarControls({ isAligned, onToggle, currentDate }: SolarControlsProps) {
  const dateString = currentDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-white shadow-2xl z-20">
      {/* Bagian Tanggal */}
      <div className="flex items-center gap-3 pr-4 border-r border-white/20">
        <CalendarDays className="w-5 h-5 text-blue-400" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Simulation Date</span>
          <span className="font-mono text-lg leading-none min-w-[140px]">{dateString}</span>
        </div>
      </div>

      {/* Bagian Tombol Play/Stop */}
      <button
        onClick={onToggle}
        className={`
          flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-sm transition-all
          ${isAligned 
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
            : 'bg-red-500/80 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
          }
        `}
      >
        {isAligned ? (
          <>
            <Play className="w-4 h-4 fill-current" /> MULAI
          </>
        ) : (
          <>
            <Pause className="w-4 h-4 fill-current" /> STOP
          </>
        )}
      </button>
    </div>
  )
}