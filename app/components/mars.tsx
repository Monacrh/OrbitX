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
      // Glow oranye kemerahan halus
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

  // HANYA Load Map Mars (Hapus Rainbow map penyebab warna biru aneh)
  const [colorMap, bumpMap] = useTexture([
    '/textures/mars_map.webp', 
    '/textures/mars_bump.jpg'
  ])

  const uniforms = useMemo(() => ({
    size: { value: 4.0 }, // Ukuran titik yang pas (tidak terlalu besar)
    colorTexture: { value: colorMap },
    elevTexture: { value: bumpMap },
    uInteractive: { value: 0.0 },
    mouseUV: { value: new THREE.Vector2(0, 0) }
  }), [colorMap, bumpMap])

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
      
      // Ambil data ketinggian
      float elv = texture2D(elevTexture, vUv).r;
      vElv = elv;

      vec3 vNormal = normalMatrix * normal;
      vVisible = step(0.0, dot( -normalize(mvPosition.xyz), normalize(vNormal)));
      
      // DISPLACEMENT YANG WAJAR
      // Sebelumnya 1.5 (Terlalu Ekstrem/Penyok) -> Sekarang 0.15 (Tekstur 3D Halus)
      float displacement = elv * 0.15; 
      
      mvPosition.z += displacement;

      // INTERAKSI MOUSE (Hover Effect)
      float dist = distance(mouseUV, vUv);
      float zDisp = 0.0;
      
      if (uInteractive > 0.0) {
        float thresh = 0.06;
        if (dist < thresh) {
           // Efek tarik mouse lebih lembut
           zDisp = (thresh - dist) * 15.0 * uInteractive;
        }
      }
      
      vDist = dist;
      mvPosition.z += zDisp;

      // Size Attenuation
      gl_PointSize = size * (8.0 / -mvPosition.z);
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  // --- FRAGMENT SHADER ---
  const fragmentShader = `
    uniform sampler2D colorTexture;
    uniform float uInteractive;

    varying vec2 vUv;
    varying float vVisible;
    varying float vDist;
    varying float vElv;

    void main() {
      if (floor(vVisible + 0.1) == 0.0) discard;

      // BENTUK LINGKARAN (PIXEL DOTS)
      // Ini membuat Mars terlihat tersusun dari titik-titik rapi
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      if (dot(cxy, cxy) > 1.0) discard; 

      vec3 color = texture2D(colorTexture, vUv).rgb;
      
      // Highlight Warna Emas (Bukan Rainbow Biru Aneh)
      vec3 highlightColor = vec3(1.0, 0.9, 0.6); 

      // Interactive Hover
      if (uInteractive > 0.0) {
        float thresh = 0.06;
        if (vDist < thresh) {
          color = mix(color, highlightColor, (thresh - vDist) * 30.0 * uInteractive);
        }
      }

      // Shading berdasarkan ketinggian (Gunung lebih terang)
      color = color * (0.6 + 0.6 * vElv);

      gl_FragColor = vec4(color, 1.0);
    }
  `

  // GEOMETRY
  // Detail Tinggi (120) agar bolanya bulat sempurna
  const pointsGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 120), [])
  const hitboxGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 8), [])
  // Bola Hitam Penutup (Occlusion)
  const occlusionGeo = useMemo(() => new THREE.IcosahedronGeometry(0.99, 64), []) 

  const pointsMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true
  }), [uniforms])

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y += 0.001
    uniforms.mouseUV.value.lerp(targetUV.current, 0.1)
    uniforms.uInteractive.value = THREE.MathUtils.lerp(uniforms.uInteractive.value, 1.0, 0.1)
  })

  return (
    <group ref={groupRef}>
      <MarsAtmosphere />

      {/* 1. HITBOX (Invisible) */}
      <mesh 
        geometry={hitboxGeo} 
        visible={false}
        onPointerMove={(e) => {
          if (e.uv) targetUV.current.copy(e.uv)
        }}
      />

      {/* 2. OCCLUSION SPHERE (Bola Hitam Dalam) */}
      <mesh geometry={occlusionGeo}>
        <meshBasicMaterial color="#2a0a00" /> 
      </mesh>

      {/* 3. VISUAL POINTS (Mars Rapi) */}
      <points 
        geometry={pointsGeo} 
        material={pointsMat} 
        raycast={() => null} 
      />
    </group>
  )
})