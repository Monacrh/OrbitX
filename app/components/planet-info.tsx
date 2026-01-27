'use client'

import { useMemo } from 'react'

type PlanetData = {
  name: string
  description: string
  stats: { label: string; value: string }[]
}

// Database Informasi Planet (Bisa ditambah/diedit sesuka hati)
const PLANET_DB: Record<string, PlanetData> = {
  SUN: {
    name: "Matahari",
    description: "Bintang di pusat Tata Surya. Bola plasma panas yang nyaris sempurna ini adalah sumber energi utama bagi kehidupan di Bumi.",
    stats: [
      { label: "Tipe", value: "Bintang Kuning (G2V)" },
      { label: "Suhu Permukaan", value: "5.500°C" },
      { label: "Diameter", value: "1.39 Juta km" },
      { label: "Massa", value: "333.000 x Bumi" }
    ]
  },
  MERCURY: {
    name: "Merkurius",
    description: "Planet terkecil dan terdekat dengan Matahari. Permukaannya penuh kawah mirip Bulan dan tidak memiliki atmosfer untuk menahan panas.",
    stats: [
      { label: "Jarak dari Matahari", value: "58 Juta km" },
      { label: "Diameter", value: "4.880 km" },
      { label: "Suhu", value: "-173°C s/d 427°C" },
      { label: "Revolusi", value: "88 Hari" }
    ]
  },
  VENUS: {
    name: "Venus",
    description: "Planet terpanas di Tata Surya karena efek rumah kaca yang ekstrem. Berotasi dengan arah yang berlawanan dari planet lain.",
    stats: [
      { label: "Jarak dari Matahari", value: "108 Juta km" },
      { label: "Diameter", value: "12.104 km" },
      { label: "Suhu Rata-rata", value: "462°C" },
      { label: "Revolusi", value: "225 Hari" }
    ]
  },
  EARTH: {
    name: "Bumi",
    description: "Satu-satunya planet yang diketahui memiliki kehidupan. Memiliki atmosfer nitrogen-oksigen dan lautan air cair yang luas.",
    stats: [
      { label: "Jarak dari Matahari", value: "149.6 Juta km" },
      { label: "Diameter", value: "12.742 km" },
      { label: "Satelit Alami", value: "1 (Bulan)" },
      { label: "Revolusi", value: "365.25 Hari" }
    ]
  },
  MARS: {
    name: "Mars",
    description: "Dikenal sebagai 'Planet Merah' karena oksida besi di permukaannya. Memiliki gunung tertinggi di Tata Surya, Olympus Mons.",
    stats: [
      { label: "Jarak dari Matahari", value: "228 Juta km" },
      { label: "Diameter", value: "6.779 km" },
      { label: "Suhu Rata-rata", value: "-63°C" },
      { label: "Satelit", value: "2 (Phobos, Deimos)" }
    ]
  },
  JUPITER: {
    name: "Jupiter",
    description: "Planet terbesar di Tata Surya. Raksasa gas ini memiliki Bintik Merah Raksasa, badai yang lebih besar dari Bumi.",
    stats: [
      { label: "Jarak dari Matahari", value: "778 Juta km" },
      { label: "Diameter", value: "139.820 km" },
      { label: "Komposisi", value: "Hidrogen, Helium" },
      { label: "Satelit", value: "95 (Diketahui)" }
    ]
  },
  SATURN: {
    name: "Saturnus",
    description: "Terkenal dengan sistem cincinnya yang megah dan kompleks. Merupakan planet dengan densitas terendah (bisa mengapung di air).",
    stats: [
      { label: "Jarak dari Matahari", value: "1.4 Miliar km" },
      { label: "Diameter", value: "116.460 km" },
      { label: "Cincin", value: "7 Kelompok Utama" },
      { label: "Revolusi", value: "29.5 Tahun" }
    ]
  },
  URANUS: {
    name: "Uranus",
    description: "Raksasa es yang unik karena berotasi 'menggelinding' dengan kemiringan poros 98 derajat. Berwarna biru-hijau karena metana.",
    stats: [
      { label: "Jarak dari Matahari", value: "2.9 Miliar km" },
      { label: "Diameter", value: "50.724 km" },
      { label: "Suhu Terdingin", value: "-224°C" },
      { label: "Revolusi", value: "84 Tahun" }
    ]
  },
  NEPTUNE: {
    name: "Neptunus",
    description: "Planet terjauh dari Matahari. Raksasa es yang gelap, dingin, dan dilanda angin supersonik tercepat di Tata Surya.",
    stats: [
      { label: "Jarak dari Matahari", value: "4.5 Miliar km" },
      { label: "Diameter", value: "49.244 km" },
      { label: "Kecepatan Angin", value: "2.100 km/jam" },
      { label: "Revolusi", value: "165 Tahun" }
    ]
  }
}

interface PlanetInfoProps {
  activePlanet: string | null
  onClose: () => void
}

export function PlanetInfo({ activePlanet, onClose }: PlanetInfoProps) {
  const info = useMemo(() => {
    if (!activePlanet || activePlanet === 'RESET') return null
    return PLANET_DB[activePlanet]
  }, [activePlanet])

  if (!info) return null

  return (
    <div className="absolute top-20 right-8 w-80 md:w-96 bg-black/80 backdrop-blur-xl border border-white/20 text-white rounded-2xl p-6 shadow-2xl animate-in slide-in-from-right-10 fade-in duration-500 z-50">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-400">
          {info.name}
        </h2>
        <button 
          onClick={onClose}
          className="text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm"
        >
          ✕
        </button>
      </div>

      {/* Description */}
      <p className="text-gray-300 text-sm leading-relaxed mb-6 border-b border-white/10 pb-6">
        {info.description}
      </p>

      {/* Stats Grid */}
      <div className="space-y-3">
        {info.stats.map((stat, i) => (
          <div key={i} className="flex justify-between items-center text-sm group">
            <span className="text-gray-400 group-hover:text-blue-300 transition-colors">{stat.label}</span>
            <span className="font-mono font-medium text-gray-100">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-white/10 text-xs text-center text-gray-500">
        Data © NASA Science Solar System
      </div>
    </div>
  )
}