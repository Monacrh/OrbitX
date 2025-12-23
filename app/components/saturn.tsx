'use client'

import { useMemo, memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// --- KOMPONEN CINCIN (RINGS) ---
function SaturnRings({ uniforms }: { uniforms: any }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPos;
    void main() {
      vUv = uv;
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform sampler2D ringTexture;
    uniform sampler2D rainbowTexture;
    uniform float uInteractive;
    
    varying vec2 vUv;
    varying vec3 vPos;

    void main() {
  // vUv.y = radial distance (inner → outer)
  float radius = vUv.y;

  // Sample ring texture radially
  vec4 ring = texture2D(ringTexture, vec2(radius, 0.5));

  // Kill transparent pixels
  if (ring.a < 0.05) discard;

  // Slight fade at edges (realistic)
  float edgeFade = smoothstep(0.0, 0.03, radius)
                 * smoothstep(1.0, 0.97, radius);

  gl_FragColor = vec4(ring.rgb, ring.a * edgeFade);
}
  `

  const ringMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide
  }), [uniforms])

  return (
    // Geometri Cincin: Inner Radius 1.4, Outer Radius 2.3
    <mesh ref={meshRef} rotation-x={Math.PI / 2} geometry={new THREE.RingGeometry(1.4, 2.3, 128)} material={ringMat} />
  )
}

// --- KOMPONEN UTAMA ---
export const SaturnMesh = memo(function SaturnMesh() {
  const groupRef = useRef<THREE.Group>(null)
  const targetUV = useRef(new THREE.Vector2(0, 0))

  // LOAD TEXTURE
  // Solusi Bump Map: Kita load 'saturn_map.jpg' DUA KALI.
  // Satu untuk warna, satu untuk ketinggian (bump).
  const [colorMap, bumpMap, ringMap, rainbowMap] = useTexture([
    '/textures/saturn_map2.jpg', 
    '/textures/saturn_map2.jpg', // Gunakan map yang sama sebagai bump
    '/textures/saturn_ring2.jpg', 
    '/textures/04_rainbow1k.jpg'
  ])

  // Set texture cincin agar repeat-nya benar (mencegah garis terpotong)
  ringMap.wrapS = THREE.RepeatWrapping
  ringMap.wrapT = THREE.RepeatWrapping

  const uniforms = useMemo(() => ({
    size: { value: 9.5 }, 
    colorTexture: { value: colorMap },
    elevTexture: { value: bumpMap },
    ringTexture: { value: ringMap },
    rainbowTexture: { value: rainbowMap },
    uInteractive: { value: 0.0 },
    mouseUV: { value: new THREE.Vector2(0, 0) }
  }), [colorMap, bumpMap, ringMap, rainbowMap])

  // --- VERTEX SHADER PLANET ---
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
      
      // Ambil data dari map warna (hitam=rendah, putih=tinggi)
      float elv = texture2D(elevTexture, vUv).r;
      vElv = elv;

      vec3 vNormal = normalMatrix * normal;
      vVisible = step(0.0, dot( -normalize(mvPosition.xyz), normalize(vNormal)));
      
      // Displacement Halus (Gas Giant tidak tajam)
      float displacement = elv * 0.1; 
      mvPosition.z += displacement;

      // Interaksi Mouse
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

  // --- FRAGMENT SHADER PLANET ---
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

      if (uInteractive > 0.0) {
        float thresh = 0.06;
        if (vDist < thresh) {
          color = mix(color, rainbowColor, (thresh - vDist) * 40.0 * uInteractive);
        }
      }

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
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002
    }
    
    uniforms.mouseUV.value.lerp(targetUV.current, 0.1)
    uniforms.uInteractive.value = THREE.MathUtils.lerp(uniforms.uInteractive.value, 1.0, 0.1)
  })

  return (
    // Kemiringan Saturnus (26.7 derajat)
    <group rotation-z={26.7 * (Math.PI / 180)}>
      <group ref={groupRef}>
        
        {/* CINCIN */}
        <SaturnRings uniforms={uniforms} />

        {/* HITBOX */}
        <mesh 
          geometry={hitboxGeo} 
          visible={false}
          onPointerMove={(e) => {
            if (e.uv) targetUV.current.copy(e.uv)
          }}
        />

        {/* OCCLUSION SPHERE (Warna krem gelap) */}
        <mesh geometry={occlusionGeo}>
          <meshBasicMaterial color="#c2a27e" /> 
        </mesh>

        {/* VISUAL POINTS */}
        <points 
          geometry={pointsGeo} 
          material={pointsMat} 
          raycast={() => null} 
        />
      </group>
    </group>
  )
})