'use client'

import { useMemo } from 'react'

type PlanetData = {
  name: string
  description: string
  stats: { label: string; value: string }[]
}

// English Planet Database
const PLANET_DB: Record<string, PlanetData> = {
  SUN: {
    name: "Sun",
    description: "The star at the center of the Solar System. It is a nearly perfect sphere of hot plasma and the primary source of energy for life on Earth.",
    stats: [
      { label: "Type", value: "Yellow Dwarf (G2V)" },
      { label: "Surface Temp", value: "5,500°C" },
      { label: "Diameter", value: "1.39 Million km" },
      { label: "Mass", value: "333,000 x Earth" }
    ]
  },
  MERCURY: {
    name: "Mercury",
    description: "The smallest planet in the Solar System and closest to the Sun. Its surface is heavily cratered like the Moon and has no atmosphere to retain heat.",
    stats: [
      { label: "Distance from Sun", value: "58 Million km" },
      { label: "Diameter", value: "4,880 km" },
      { label: "Temperature", value: "-173°C to 427°C" },
      { label: "Orbital Period", value: "88 Days" }
    ]
  },
  VENUS: {
    name: "Venus",
    description: "The hottest planet in the Solar System due to an extreme greenhouse effect. It rotates in the opposite direction to most other planets.",
    stats: [
      { label: "Distance from Sun", value: "108 Million km" },
      { label: "Diameter", value: "12,104 km" },
      { label: "Avg Temp", value: "462°C" },
      { label: "Orbital Period", value: "225 Days" }
    ]
  },
  EARTH: {
    name: "Earth",
    description: "The only planet known to harbor life. It has a nitrogen-oxygen atmosphere and vast oceans of liquid water covering 70% of its surface.",
    stats: [
      { label: "Distance from Sun", value: "149.6 Million km" },
      { label: "Diameter", value: "12,742 km" },
      { label: "Natural Satellites", value: "1 (The Moon)" },
      { label: "Orbital Period", value: "365.25 Days" }
    ]
  },
  MARS: {
    name: "Mars",
    description: "Known as the 'Red Planet' due to iron oxide on its surface. It hosts Olympus Mons, the tallest volcano in the Solar System.",
    stats: [
      { label: "Distance from Sun", value: "228 Million km" },
      { label: "Diameter", value: "6,779 km" },
      { label: "Avg Temp", value: "-63°C" },
      { label: "Satellites", value: "2 (Phobos, Deimos)" }
    ]
  },
  JUPITER: {
    name: "Jupiter",
    description: "The largest planet in the Solar System. This gas giant is famous for its Great Red Spot, a storm larger than Earth that has raged for centuries.",
    stats: [
      { label: "Distance from Sun", value: "778 Million km" },
      { label: "Diameter", value: "139,820 km" },
      { label: "Composition", value: "Hydrogen, Helium" },
      { label: "Satellites", value: "95 (Known)" }
    ]
  },
  SATURN: {
    name: "Saturn",
    description: "Famous for its magnificent and complex ring system. It is the only planet less dense than water (it would float in a giant bathtub).",
    stats: [
      { label: "Distance from Sun", value: "1.4 Billion km" },
      { label: "Diameter", value: "116,460 km" },
      { label: "Rings", value: "7 Main Groups" },
      { label: "Orbital Period", value: "29.5 Years" }
    ]
  },
  URANUS: {
    name: "Uranus",
    description: "An ice giant unique for rotating on its side with a 98-degree axial tilt. Its blue-green color comes from methane in its atmosphere.",
    stats: [
      { label: "Distance from Sun", value: "2.9 Billion km" },
      { label: "Diameter", value: "50,724 km" },
      { label: "Coldest Temp", value: "-224°C" },
      { label: "Orbital Period", value: "84 Years" }
    ]
  },
  NEPTUNE: {
    name: "Neptune",
    description: "The farthest known planet from the Sun. A dark, cold ice giant whipped by supersonic winds, the fastest in the Solar System.",
    stats: [
      { label: "Distance from Sun", value: "4.5 Billion km" },
      { label: "Diameter", value: "49,244 km" },
      { label: "Wind Speed", value: "2,100 km/h" },
      { label: "Orbital Period", value: "165 Years" }
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
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
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