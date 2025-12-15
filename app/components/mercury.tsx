'use client'

import { useMemo, memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// KOMPONEN UTAMA
export const MercuryMesh = memo(function MercuryMesh() {
  const groupRef = useRef<THREE.Group>(null)
  const targetUV = useRef(new THREE.Vector2(0, 0))

  // --- PERUBAHAN 1: Load Texture Pelangi ---
  const [colorMap, bumpMap, rainbowMap] = useTexture([
    '/textures/mercury_map.jpg', 
    '/textures/mercury_bump.jpg',
    '/textures/04_rainbow1k.jpg' // Texture pelangi yang sama dengan Bumi
  ])

  const uniforms = useMemo(() => ({
    size: { value: 1.0 }, 
    colorTexture: { value: colorMap },
    elevTexture: { value: bumpMap },
    // --- PERUBAHAN 2: Masukkan ke Uniforms ---
    rainbowTexture: { value: rainbowMap }, 
    uInteractive: { value: 0.0 },
    mouseUV: { value: new THREE.Vector2(0, 0) }
  }), [colorMap, bumpMap, rainbowMap])

  // --- VERTEX SHADER (TIDAK BERUBAH) ---
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
      
      // Displacement Kawah
      float displacement = elv * 0.25; 
      mvPosition.z += displacement;

      // Interaksi Mouse (Lonjakan Tinggi)
      float dist = distance(mouseUV, vUv);
      float zDisp = 0.0;
      
      if (uInteractive > 0.0) {
        float thresh = 0.06;
        if (dist < thresh) {
           zDisp = (thresh - dist) * 10.0 * uInteractive;
        }
      }
      
      vDist = dist;
      mvPosition.z += zDisp;

      gl_PointSize = size * (8.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  // --- FRAGMENT SHADER (BERUBAH UNTUK RAINBOW) ---
  const fragmentShader = `
    uniform sampler2D colorTexture;
    // --- PERUBAHAN 3: Tambah Uniform Rainbow Texture ---
    uniform sampler2D rainbowTexture;
    uniform float uInteractive;

    varying vec2 vUv;
    varying float vVisible;
    varying float vDist;
    varying float vElv;

    void main() {
      if (floor(vVisible + 0.1) == 0.0) discard;

      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      if (dot(cxy, cxy) > 1.0) discard; 

      // Warna Asli (Abu-abu)
      vec3 color = texture2D(colorTexture, vUv).rgb;
      
      // --- PERUBAHAN 4: Ambil Warna Pelangi dari Texture ---
      // (Menggantikan highlightColor manual sebelumnya)
      vec3 rainbowColor = texture2D(rainbowTexture, vUv).rgb;

      if (uInteractive > 0.0) {
        float thresh = 0.06;
        if (vDist < thresh) {
          // Campur warna asli dengan warna PELANGI saat hover
          color = mix(color, rainbowColor, (thresh - vDist) * 40.0 * uInteractive);
        }
      }

      // Shading Kawah
      color = color * (0.5 + 0.8 * vElv);

      gl_FragColor = vec4(color, 1.0);
    }
  `

  // GEOMETRY
  const pointsGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 120), [])
  const hitboxGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 8), [])
  const occlusionGeo = useMemo(() => new THREE.IcosahedronGeometry(0.99, 64), []) 

  const pointsMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true
  }), [uniforms])

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0005
    uniforms.mouseUV.value.lerp(targetUV.current, 0.1)
    uniforms.uInteractive.value = THREE.MathUtils.lerp(uniforms.uInteractive.value, 1.0, 0.1)
  })

  return (
    <group ref={groupRef}>
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
        <meshBasicMaterial color="#1a1a1a" /> 
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