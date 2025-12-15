'use client'

import { useMemo, memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// --- 1. ATMOSFER DIHAPUS (Agar tidak ada cahaya/glow) ---

// --- 2. KOMPONEN UTAMA ---
export const VenusMesh = memo(function VenusMesh() {
  const groupRef = useRef<THREE.Group>(null)
  const targetUV = useRef(new THREE.Vector2(0, 0))

  const [colorMap, bumpMap, rainbowMap] = useTexture([
    '/textures/venus_map.jpg', 
    '/textures/venus_bump.jpg',
    '/textures/04_rainbow1k.jpg' // Rainbow texture
  ])

  const uniforms = useMemo(() => ({
    size: { value: 1.5 }, // Ukuran titik
    colorTexture: { value: colorMap },
    elevTexture: { value: bumpMap },
    rainbowTexture: { value: rainbowMap },
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
      
      // Displacement: Venus awan, gelombang halus (0.15)
      float displacement = elv * 0.15; 
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

  // --- FRAGMENT SHADER ---
  const fragmentShader = `
    uniform sampler2D colorTexture;
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

      vec3 color = texture2D(colorTexture, vUv).rgb;
      vec3 rainbowColor = texture2D(rainbowTexture, vUv).rgb;

      // Efek Hover Rainbow
      if (uInteractive > 0.0) {
        float thresh = 0.06;
        if (vDist < thresh) {
          color = mix(color, rainbowColor, (thresh - vDist) * 40.0 * uInteractive);
        }
      }

      // Shading halus
      color = color * (0.8 + 0.4 * vElv);

      gl_FragColor = vec4(color, 1.0);
    }
  `

  // GEOMETRY
  const pointsGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 120), [])
  const hitboxGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 8), [])
  const occlusionGeo = useMemo(() => new THREE.IcosahedronGeometry(0.99, 64), []) 

  // MATERIAL
  const pointsMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true
  }), [uniforms, vertexShader, fragmentShader])

  useFrame((state) => {
    // Rotasi Venus (Retrograde/Mundur)
    if (groupRef.current) groupRef.current.rotation.y -= 0.0005 
    
    uniforms.mouseUV.value.lerp(targetUV.current, 0.1)
    uniforms.uInteractive.value = THREE.MathUtils.lerp(uniforms.uInteractive.value, 1.0, 0.1)
  })

  return (
    <group ref={groupRef}>
      {/* SAYA HAPUS VenusAtmosphere DI SINI */}

      {/* HITBOX */}
      <mesh 
        geometry={hitboxGeo} 
        visible={false}
        onPointerMove={(e) => {
          if (e.uv) targetUV.current.copy(e.uv)
        }}
      />

      {/* OCCLUSION SPHERE (Warna Kuning Gelap) */}
      <mesh geometry={occlusionGeo}>
        <meshBasicMaterial color="#3a3020" /> 
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


// ADA CAHAYA

// 'use client'

// import { useMemo, memo, useRef } from 'react'
// import { useFrame } from '@react-three/fiber'
// import { useTexture } from '@react-three/drei'
// import * as THREE from 'three'

// // --- 1. ATMOSFER VENUS (Sangat Tebal & Berkilau) ---
// function VenusAtmosphere() {
//   const meshRef = useRef<THREE.Mesh>(null)
  
//   const vertexShader = `
//     varying vec3 vNormal;
//     void main() {
//       vNormal = normalize(normalMatrix * normal);
//       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
//   `
//   const fragmentShader = `
//     varying vec3 vNormal;
//     void main() {
//       // Glow Intensitas Tinggi (karena atmosfer Venus sangat padat)
//       float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
      
//       // Warna: Kuning Keemasan Pucat
//       vec3 atmosphereColor = vec3(0.9, 0.8, 0.6); 
      
//       gl_FragColor = vec4(atmosphereColor, 1.0) * intensity * 2.5;
//     }
//   `
//   return (
//     // Scale lebih besar (1.2) karena atmosfernya luas
//     <mesh ref={meshRef} scale={[1.2, 1.2, 1.2]}> 
//       <icosahedronGeometry args={[1, 64]} />
//       <shaderMaterial
//         vertexShader={vertexShader}
//         fragmentShader={fragmentShader}
//         blending={THREE.AdditiveBlending}
//         side={THREE.BackSide}
//         transparent={true}
//         depthWrite={false}
//       />
//     </mesh>
//   )
// }

// // --- 2. KOMPONEN UTAMA ---
// export const VenusMesh = memo(function VenusMesh() {
//   const groupRef = useRef<THREE.Group>(null)
//   const targetUV = useRef(new THREE.Vector2(0, 0))

//   // Load Textures (Pastikan kamu punya venus_map & venus_bump)
//   // Bump map Venus biasanya tekstur awan atau radar permukaan
//   const [colorMap, bumpMap, rainbowMap] = useTexture([
//     '/textures/venus_map.jpg', 
//     '/textures/venus_bump.jpg',
//     '/textures/04_rainbow1k.jpg' // Rainbow texture
//   ])

//   const uniforms = useMemo(() => ({
//     size: { value: 3.0 }, 
//     colorTexture: { value: colorMap },
//     elevTexture: { value: bumpMap },
//     rainbowTexture: { value: rainbowMap },
//     uInteractive: { value: 0.0 },
//     mouseUV: { value: new THREE.Vector2(0, 0) }
//   }), [colorMap, bumpMap, rainbowMap])

//   // --- VERTEX SHADER ---
//   const vertexShader = `
//     uniform float size;
//     uniform sampler2D elevTexture;
//     uniform vec2 mouseUV;
//     uniform float uInteractive;

//     varying vec2 vUv;
//     varying float vVisible;
//     varying float vDist;
//     varying float vElv;

//     void main() {
//       vUv = uv;
//       vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      
//       float elv = texture2D(elevTexture, vUv).r;
//       vElv = elv;

//       vec3 vNormal = normalMatrix * normal;
//       vVisible = step(0.0, dot( -normalize(mvPosition.xyz), normalize(vNormal)));
      
//       // Displacement: Venus itu awan, jadi gelombangnya halus (0.15)
//       float displacement = elv * 0.15; 
//       mvPosition.z += displacement;

//       // Interaksi Mouse (Lonjakan Tinggi 60.0)
//       float dist = distance(mouseUV, vUv);
//       float zDisp = 0.0;
      
//       if (uInteractive > 0.0) {
//         float thresh = 0.06;
//         if (dist < thresh) {
//            zDisp = (thresh - dist) * 10.0 * uInteractive;
//         }
//       }
      
//       vDist = dist;
//       mvPosition.z += zDisp;

//       gl_PointSize = size * (8.0 / -mvPosition.z);
//       gl_Position = projectionMatrix * mvPosition;
//     }
//   `

//   // --- FRAGMENT SHADER ---
//   const fragmentShader = `
//     uniform sampler2D colorTexture;
//     uniform sampler2D rainbowTexture;
//     uniform float uInteractive;

//     varying vec2 vUv;
//     varying float vVisible;
//     varying float vDist;
//     varying float vElv;

//     void main() {
//       if (floor(vVisible + 0.1) == 0.0) discard;

//       vec2 cxy = 2.0 * gl_PointCoord - 1.0;
//       if (dot(cxy, cxy) > 1.0) discard; 

//       vec3 color = texture2D(colorTexture, vUv).rgb;
//       vec3 rainbowColor = texture2D(rainbowTexture, vUv).rgb;

//       // Efek Hover Rainbow
//       if (uInteractive > 0.0) {
//         float thresh = 0.06;
//         if (vDist < thresh) {
//           color = mix(color, rainbowColor, (thresh - vDist) * 40.0 * uInteractive);
//         }
//       }

//       // Shading halus untuk awan
//       color = color * (0.8 + 0.4 * vElv);

//       gl_FragColor = vec4(color, 1.0);
//     }
//   `

//   // GEOMETRY
//   const pointsGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 120), [])
//   const hitboxGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 8), [])
//   const occlusionGeo = useMemo(() => new THREE.IcosahedronGeometry(0.99, 64), []) 

//   // MATERIAL
//   const pointsMat = useMemo(() => new THREE.ShaderMaterial({
//     uniforms,
//     vertexShader,
//     fragmentShader,
//     transparent: true
//   }), [uniforms, vertexShader, fragmentShader])

//   useFrame((state) => {
//     // Rotasi Venus SANGAT LAMBAT dan BERLAWANAN arah (Retrograde Rotation)
//     // Venus berputar kebalikan dari bumi
//     if (groupRef.current) groupRef.current.rotation.y -= 0.0002 
    
//     uniforms.mouseUV.value.lerp(targetUV.current, 0.1)
//     uniforms.uInteractive.value = THREE.MathUtils.lerp(uniforms.uInteractive.value, 1.0, 0.1)
//   })

//   return (
//     <group ref={groupRef}>
//       <VenusAtmosphere />

//       {/* HITBOX */}
//       <mesh 
//         geometry={hitboxGeo} 
//         visible={false}
//         onPointerMove={(e) => {
//           if (e.uv) targetUV.current.copy(e.uv)
//         }}
//       />

//       {/* OCCLUSION SPHERE (Warna Kuning Gelap) */}
//       <mesh geometry={occlusionGeo}>
//         <meshBasicMaterial color="#3a3020" /> 
//       </mesh>

//       {/* VISUAL POINTS */}
//       <points 
//         geometry={pointsGeo} 
//         material={pointsMat} 
//         raycast={() => null} 
//       />
//     </group>
//   )
// })