'use client'

import { useRef, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Html, CameraControls } from '@react-three/drei'
import * as THREE from 'three'

import { SunMesh } from './components/sun'
import { EarthMesh } from './components/earth'
import { MarsMesh } from './components/mars'
import { MercuryMesh } from './components/mercury'
import { VenusMesh } from './components/venus'
import { JupiterMesh } from './components/jupiter'
import { SaturnMesh } from './components/saturn'
import { UranusMesh } from './components/uranus'
import { NeptuneMesh } from './components/neptune'
import { SolarControls } from './components/solarpanel'

// --- KONSTANTA SKALA (Ubah ini untuk mengatur besar/kecil seluruh planet) ---
// Kita kecilkan jadi 0.6 (60%) agar tidak berdempetan di orbit
const BASE_SCALE = 0.6 

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
      {/* Garis Orbit */}
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
  const [focusTarget, setFocusTarget] = useState<'SUN' | 'MERCURY' | 'VENUS' | 'EARTH' | 'MARS' | 'JUPITER' | 'SATURN' | 'URANUS' | 'NEPTUNE' | 'RESET' | null>(null)

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

  const handleFocus = (target: 'SUN' | 'MERCURY' | 'VENUS' | 'EARTH' | 'MARS' | 'JUPITER' | 'SATURN' | 'URANUS' | 'NEPTUNE' | 'RESET') => {
    if (!cameraRef.current) return
    
    setFocusTarget(target)
    setIsAligned(true)

    // Logika Kamera (Disesuaikan dengan planet yang lebih kecil)
    // Format: setLookAt(EyeX, EyeY, EyeZ, TargetX, TargetY, TargetZ, Transition)
    // Kita dekatkan kamera sedikit karena planetnya mengecil
    switch (target) {
      case 'SUN':
        cameraRef.current.setLookAt(6, 2, 6, 0, 0, 0, true) 
        break
      case 'MERCURY':
        // Radius 6
        cameraRef.current.setLookAt(8, 1, 2, 6, 0, 0, true)
        break
      case 'VENUS':
        // Radius 8
        cameraRef.current.setLookAt(10.5, 1.5, 2.5, 8, 0, 0, true)
        break
      case 'EARTH':
        // Radius 10
        cameraRef.current.setLookAt(12.5, 1.5, 2.5, 10, 0, 0, true)
        break
      case 'MARS':
        // Radius 16
        cameraRef.current.setLookAt(18, 1.5, 2.5, 16, 0, 0, true)
        break
      case 'JUPITER':
        // Radius 24
        cameraRef.current.setLookAt(30, 4, 8, 24, 0, 0, true)
        break
      // Di dalam handleFocus switch:
      case 'SATURN':
        cameraRef.current.setLookAt(40, 5, 10, 32, 0, 0, true)
        break
      case 'URANUS':
        cameraRef.current.setLookAt(50, 6, 12, 40, 0, 0, true)
        break
      case 'NEPTUNE':
        cameraRef.current.setLookAt(56, 5, 10, 48, 0, 0, true)
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

        <CameraControls 
          ref={cameraRef} 
          makeDefault 
          smoothTime={0.25} 
          dollySpeed={10}
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
           {/* Matahari tetap besar atau bisa dikecilkan juga jika mau */}
           <group scale={[0.8, 0.8, 0.8]}>
             <SunMesh /> 
           </group>
        </group>

        {/* 2. MERKURIUS (Radius 6) */}
        <PlanetOrbit 
          radius={6} 
          speed={1.5} 
          name="Merkurius" 
          isAligned={isAligned}
          onPlanetClick={() => handleFocus('MERCURY')}
        >
          {/* Scale: 0.38 (Asli) * 0.6 (Base) = 0.228 */}
          <group scale={[0.38 * BASE_SCALE, 0.38 * BASE_SCALE, 0.38 * BASE_SCALE]}>
            <MercuryMesh />
          </group>
        </PlanetOrbit>

        {/* 3. VENUS (Radius 8) */}
        <PlanetOrbit 
          radius={8} 
          speed={1.2} 
          name="Venus" 
          isAligned={isAligned}
          onPlanetClick={() => handleFocus('VENUS')}
        >
          {/* Scale: 0.95 (Asli) * 0.6 (Base) = 0.57 */}
          <group scale={[0.95 * BASE_SCALE, 0.95 * BASE_SCALE, 0.95 * BASE_SCALE]}>
            <VenusMesh />
          </group>
        </PlanetOrbit>

        {/* 4. BUMI (Radius 10) */}
        <PlanetOrbit 
          radius={10} 
          speed={1} 
          name="Bumi" 
          isAligned={isAligned}
          onPlanetClick={() => handleFocus('EARTH')}
        >
          {/* Scale: 1.0 (Asli) * 0.6 (Base) = 0.6 */}
          <group scale={[1 * BASE_SCALE, 1 * BASE_SCALE, 1 * BASE_SCALE]}>
            <EarthMesh active={focusTarget === 'EARTH'} />
          </group>
        </PlanetOrbit>

        {/* 5. MARS (Radius 16) */}
        <PlanetOrbit 
          radius={16} 
          speed={0.53} 
          name="Mars" 
          isAligned={isAligned}
          onPlanetClick={() => handleFocus('MARS')}
        >
          {/* Scale: 0.53 (Asli) * 0.6 (Base) = 0.318 */}
          <group scale={[0.53 * BASE_SCALE, 0.53 * BASE_SCALE, 0.53 * BASE_SCALE]}>
            <MarsMesh />
          </group>
        </PlanetOrbit>

        {/* 6. JUPITER (Radius 24) */}
        <PlanetOrbit 
          radius={24} 
          speed={0.2} // Sangat lambat mengelilingi matahari
          name="Jupiter" 
          isAligned={isAligned}
          onPlanetClick={() => handleFocus('JUPITER')}
        >
          {/* Scale: 2.5 (Besar) * 0.6 (Base) = 1.5 */}
          <group scale={[2.5 * BASE_SCALE, 2.5 * BASE_SCALE, 2.5 * BASE_SCALE]}>
            <JupiterMesh />
          </group>
        </PlanetOrbit>
        
        {/* 7. SATURNUS (Radius 32) */}
        <PlanetOrbit 
          radius={32} 
          speed={0.15} // Lebih lambat dari Jupiter
          name="Saturnus" 
          isAligned={isAligned}
          onPlanetClick={() => handleFocus('SATURN')}
        >
          {/* Scale: 2.1 (Sedikit lebih kecil dari Jupiter) * 0.6 (Base) = 1.26 */}
          <group scale={[2.1 * BASE_SCALE, 2.1 * BASE_SCALE, 2.1 * BASE_SCALE]}>
            <SaturnMesh />
          </group>
        </PlanetOrbit>

        <PlanetOrbit 
          radius={40} 
          speed={0.1} // Lebih lambat dari Jupiter
          name="Uranus" 
          isAligned={isAligned}
          onPlanetClick={() => handleFocus('URANUS')}
        >
          <group scale={[1.8 * BASE_SCALE, 1.8 * BASE_SCALE, 1.8 * BASE_SCALE]}>
            <UranusMesh />
          </group>
        </PlanetOrbit>

        <PlanetOrbit 
          radius={48} 
          speed={0.08} // Paling lambat
          name="Neptunus" 
          isAligned={isAligned}
          onPlanetClick={() => handleFocus('NEPTUNE')}
        >
          {/* Ukuran mirip Uranus */}
          <group scale={[1.8 * BASE_SCALE, 1.8 * BASE_SCALE, 1.8 * BASE_SCALE]}>
            <NeptuneMesh />
          </group>
        </PlanetOrbit>

      </Canvas>
      
      <div className="absolute top-8 left-8 text-white z-10 pointer-events-none select-none">
        <h1 className="text-3xl font-bold tracking-tight">Solar Panel</h1>
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