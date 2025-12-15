'use client'

import { useMemo, memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// --- 1. ATMOSFER (Glow Belakang) ---
function MarsAtmosphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const vertexShader = `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  const fragmentShader = `
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
      vec3 atmosphereColor = vec3(0.9, 0.4, 0.2); 
      gl_FragColor = vec4(atmosphereColor, 1.0) * intensity * 1.8;
    }
  `
  return (
    <mesh ref={meshRef} scale={[1.15, 1.15, 1.15]}> 
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  )
}

// --- 2. KOMPONEN UTAMA ---
export const MarsMesh = memo(function MarsMesh() {
  const groupRef = useRef<THREE.Group>(null)
  const targetUV = useRef(new THREE.Vector2(0, 0))

  // 1. Load Textures (Termasuk Rainbow)
  const [colorMap, bumpMap, rainbowMap] = useTexture([
    '/textures/mars_map.webp', 
    '/textures/mars_bump.jpg',
    '/textures/04_rainbow1k.jpg' // Tambahkan tekstur pelangi
  ])

  // 2. Uniforms
  const uniforms = useMemo(() => ({
    size: { value: 3.0 },
    colorTexture: { value: colorMap },
    elevTexture: { value: bumpMap },
    rainbowTexture: { value: rainbowMap }, // Masukkan ke uniform
    uInteractive: { value: 0.0 },
    mouseUV: { value: new THREE.Vector2(0, 0) }
  }), [colorMap, bumpMap, rainbowMap])

  // --- VERTEX SHADER ---
  const vertexShader = `
    uniform float size;
    uniform sampler2D elevTexture;
    uniform vec2 mouseUV;
    uniform float uInteractive;

    varying vec2 vUv;
    varying float vVisible;
    varying float vDist;
    varying float vElv;

    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      
      float elv = texture2D(elevTexture, vUv).r;
      vElv = elv;

      vec3 vNormal = normalMatrix * normal;
      vVisible = step(0.0, dot( -normalize(mvPosition.xyz), normalize(vNormal)));
      
      // Displacement (Gunung Mars)
      float displacement = elv * 0.15; 
      mvPosition.z += displacement;

      // Interaksi Mouse (Lonjakan Tinggi seperti Bumi)
      float dist = distance(mouseUV, vUv);
      float zDisp = 0.0;
      
      if (uInteractive > 0.0) {
        float thresh = 0.06;
        if (dist < thresh) {
           zDisp = (thresh - dist) * 10.0 * uInteractive; // Naikkan ke 60.0
        }
      }
      
      vDist = dist;
      mvPosition.z += zDisp;

      gl_PointSize = size * (8.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  // --- FRAGMENT SHADER (Rainbow Logic) ---
  const fragmentShader = `
    uniform sampler2D colorTexture;
    uniform sampler2D rainbowTexture; // Texture Pelangi
    uniform float uInteractive;

    varying vec2 vUv;
    varying float vVisible;
    varying float vDist;
    varying float vElv;

    void main() {
      if (floor(vVisible + 0.1) == 0.0) discard;

      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      if (dot(cxy, cxy) > 1.0) discard; 

      vec3 color = texture2D(colorTexture, vUv).rgb;
      
      // Ambil warna pelangi
      vec3 rainbowColor = texture2D(rainbowTexture, vUv).rgb;

      // Mix dengan warna pelangi saat hover
      if (uInteractive > 0.0) {
        float thresh = 0.06;
        if (vDist < thresh) {
          color = mix(color, rainbowColor, (thresh - vDist) * 40.0 * uInteractive);
        }
      }

      color = color * (0.6 + 0.6 * vElv);

      gl_FragColor = vec4(color, 1.0);
    }
  `

  // GEOMETRY
  const pointsGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 120), [])
  const hitboxGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 8), [])
  const occlusionGeo = useMemo(() => new THREE.IcosahedronGeometry(0.99, 64), []) 

  // MATERIAL
  // Fix ESLint: Hapus 'uniforms' dari dependency array agar mutasi di useFrame tidak dianggap error immutability
  // ShaderMaterial menyimpan referensi ke objek uniforms, jadi kita tidak perlu membuatnya ulang kecuali uniforms ganti object baru.
  const pointsMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true
  }), [uniforms, vertexShader, fragmentShader]) 

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.001
    
    // Animasi Uniforms
    uniforms.mouseUV.value.lerp(targetUV.current, 0.1)
    
    // ini aman secara logika Three.js.
    uniforms.uInteractive.value = THREE.MathUtils.lerp(uniforms.uInteractive.value, 1.0, 0.1)
  })

  return (
    <group ref={groupRef}>
      <MarsAtmosphere />

      {/* HITBOX */}
      <mesh 
        geometry={hitboxGeo} 
        visible={false}
        onPointerMove={(e) => {
          if (e.uv) targetUV.current.copy(e.uv)
        }}
      />

      {/* OCCLUSION SPHERE */}
      <mesh geometry={occlusionGeo}>
        <meshBasicMaterial color="#2a0a00" /> 
      </mesh>

      {/* VISUAL POINTS */}
      <points 
        geometry={pointsGeo} 
        material={pointsMat} 
        raycast={() => null} 
      />
    </group>
  )
})