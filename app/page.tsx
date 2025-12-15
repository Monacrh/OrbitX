'use client'

import { useRef, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Html, CameraControls } from '@react-three/drei'
import * as THREE from 'three'

import { SunMesh } from './components/sun'
import { MercuryMesh } from './components/mercury'
import { EarthMesh } from './components/earth'
import { MarsMesh } from './components/mars'
import { SolarControls } from './components/solarpanel'

// --- HELPER: TIME MANAGER ---
function TimeManager({ isRunning, onUpdateDate }: { isRunning: boolean, onUpdateDate: () => void }) {
  useFrame(() => {
    if (isRunning) onUpdateDate()
  })
  return null
}

// --- HELPER: PLANET ORBIT ---
interface PlanetOrbitProps {
  radius: number
  speed: number
  children: React.ReactNode
  name: string
  isAligned: boolean
  onPlanetClick: () => void
}

function PlanetOrbit({ radius, speed, children, name, isAligned, onPlanetClick }: PlanetOrbitProps) {
  const orbitRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (orbitRef.current) {
      if (isAligned) {
        orbitRef.current.rotation.y = THREE.MathUtils.lerp(orbitRef.current.rotation.y, 0, 0.05)
      } else {
        orbitRef.current.rotation.y += speed * 0.005
      }
    }
  })

  return (
    <group>
      <mesh rotation-x={Math.PI / 2} visible={!isAligned}>
        <ringGeometry args={[radius - 0.05, radius + 0.05, 128]} />
        <meshBasicMaterial color="#ffffff" opacity={0.05} transparent side={THREE.DoubleSide} />
      </mesh>

      <group ref={orbitRef}>
        <group position={[radius, 0, 0]}>
          <group 
            onClick={(e) => {
              e.stopPropagation()
              onPlanetClick()
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
          >
            {children}
          </group>

          <Html distanceFactor={15} position={[0, 1.5, 0]}>
            <div className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs border border-white/10 select-none pointer-events-none whitespace-nowrap">
              {name}
            </div>
          </Html>
        </group>
      </group>
    </group>
  )
}

// --- MAIN COMPONENT ---
export default function SolarSystem() {
  const [isAligned, setIsAligned] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [focusTarget, setFocusTarget] = useState<'SUN' | 'MERCURY' | 'EARTH' | 'MARS' | 'RESET' | null>(null)

  const cameraRef = useRef<CameraControls>(null)
  const frameCounter = useRef(0)

  const handleTimeUpdate = useCallback(() => {
    frameCounter.current += 1
    if (frameCounter.current % 5 === 0) {
      setCurrentDate((prevDate) => {
        const newDate = new Date(prevDate)
        newDate.setDate(prevDate.getDate() + 1)
        return newDate
      })
    }
  }, [])

  const handleFocus = (target: 'SUN' | 'MERCURY' | 'EARTH' | 'MARS' | 'RESET') => {
    if (!cameraRef.current) return
    
    setFocusTarget(target)
    setIsAligned(true)

    // Jarak kamera disesuaikan agar tidak terlalu dekat (menjaga performa)
    switch (target) {
      case 'SUN':
        cameraRef.current.setLookAt(6, 2, 6, 0, 0, 0, true) 
        break
      case 'MERCURY':
        cameraRef.current.setLookAt(8, 1, 2, 6, 0, 0, true)
        break
      case 'EARTH':
        cameraRef.current.setLookAt(14, 2, 4, 10, 0, 0, true)
        break
      case 'MARS':
        cameraRef.current.setLookAt(19, 2, 4, 16, 0, 0, true)
        break
      case 'RESET':
        setFocusTarget(null)
        cameraRef.current.setLookAt(0, 15, 40, 0, 0, 0, true)
        break
    }
  }

  const handleTogglePlay = () => {
    if (isAligned) {
      setIsAligned(false)
      setFocusTarget(null)
      cameraRef.current?.setLookAt(0, 15, 40, 0, 0, 0, true)
    } else {
      setIsAligned(true)
    }
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      
      <Canvas
        camera={{ position: [0, 15, 40], fov: 45 }}
        gl={{ antialias: true }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
      >
        <color attach="background" args={['#000005']} />
        <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade />
        <ambientLight intensity={0.1} />

        {/* --- SETTINGAN KAMERA BARU --- */}
        <CameraControls 
          ref={cameraRef} 
          makeDefault 
          smoothTime={0.25}  // DITURUNKAN: Agar responsif (tidak berat/lambat)
          dollySpeed={10}   // DITAMBAHKAN: Agar scroll zoom lebih cepat
          maxDistance={100} 
          minDistance={2} 
        />

        <TimeManager isRunning={!isAligned} onUpdateDate={handleTimeUpdate} />

        {/* 1. MATAHARI */}
        <group 
          position={[0, 0, 0]} 
          onClick={(e) => {
            e.stopPropagation()
            handleFocus('SUN')
          }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
           <SunMesh /> 
        </group>

        {/* 2. MERCURY */}
        <PlanetOrbit 
          radius={6} 
          speed={1.5} // Lebih cepat dari Bumi
          name="Merkurius" 
          isAligned={isAligned}
          onPlanetClick={() => handleFocus('MERCURY')}
        >
          <group scale={[0.38, 0.38, 0.38]}> {/* Ukuran asli Merkurius */}
            <MercuryMesh />
          </group>
        </PlanetOrbit>

        {/* 2. BUMI */}
        <PlanetOrbit 
          radius={10} 
          speed={1} 
          name="Bumi" 
          isAligned={isAligned}
          onPlanetClick={() => handleFocus('EARTH')}
        >
          <EarthMesh active={focusTarget === 'EARTH'} />
        </PlanetOrbit>

        {/* 3. MARS */}
        <PlanetOrbit 
          radius={16} 
          speed={0.53} 
          name="Mars" 
          isAligned={isAligned}
          onPlanetClick={() => handleFocus('MARS')}
        >
          <group scale={[0.53, 0.53, 0.53]}>
            <MarsMesh />
          </group>
        </PlanetOrbit>

      </Canvas>
      
      <div className="absolute top-8 left-8 text-white z-10 pointer-events-none select-none">
        <h1 className="text-3xl font-bold tracking-tight">Tata Surya</h1>
        <p className="text-sm text-blue-300/80">Interactive 3D Simulation</p>
      </div>

      {focusTarget && (
        <button 
          onClick={() => handleFocus('RESET')}
          className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md border border-white/20 transition-all z-20 cursor-pointer animate-in fade-in zoom-in duration-300"
        >
          ↺ Reset Camera
        </button>
      )}

      <SolarControls 
        isAligned={isAligned}
        onToggle={handleTogglePlay}
        currentDate={currentDate}
      />
      
    </div>
  )
}