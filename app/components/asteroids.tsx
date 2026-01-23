'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function AsteroidBelt({ count = 800, radiusStart = 18, radiusEnd = 22 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  
  // Kita gunakan useMemo agar perhitungan posisi hanya dilakukan sekali saat mount
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const t = new THREE.Object3D()
      
      // 1. Tentukan jarak acak di antara Mars (16) dan Jupiter (24)
      const r = THREE.MathUtils.randFloat(radiusStart, radiusEnd)
      // 2. Tentukan sudut acak (lingkaran penuh)
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2)
      
      // 3. Konversi Polar ke Cartesian (X, Z)
      const x = r * Math.cos(theta)
      const z = r * Math.sin(theta)
      
      // 4. Beri sedikit variasi naik/turun di sumbu Y (agar tidak terlalu datar)
      const y = THREE.MathUtils.randFloatSpread(1.5)

      t.position.set(x, y, z)
      
      // 5. Rotasi dan Skala acak untuk setiap batu
      t.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      const scale = Math.random() * 0.15 + 0.05 // Ukuran bervariasi
      t.scale.set(scale, scale, scale)
      
      t.updateMatrix()
      temp.push(t.matrix)
    }
    return temp
  }, [count, radiusStart, radiusEnd])

  // Update matriks instancedMesh
  if (meshRef.current) {
    particles.forEach((matrix, i) => meshRef.current!.setMatrixAt(i, matrix))
    meshRef.current.instanceMatrix.needsUpdate = true
  }

  useFrame(() => {
    if (meshRef.current) {
      // Putar seluruh sabuk asteroid secara perlahan
      meshRef.current.rotation.y += 0.0005
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Geometri batu sederhana (Dodecahedron) */}
      <dodecahedronGeometry args={[1, 0]} />
      
      {/* PERBAIKAN: Gunakan meshBasicMaterial dengan warna abu-abu terang */}
      {/* Material ini tidak terpengaruh cahaya, jadi pasti terlihat di background hitam */}
      <meshBasicMaterial color="#b0a090" />
    </instancedMesh>
  )
}