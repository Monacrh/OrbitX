'use client'

import { useMemo, memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// --- 1. KOMPONEN CINCIN (NEW DESIGN) ---
// Menggunakan shader radial baru agar tekstur melingkar sempurna dan halus
const ringVertexShader = `
  varying vec3 vPos;
  varying vec2 vUv;
  void main() {
    vPos = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ringFragmentShader = `
  uniform sampler2D ringTexture;
  uniform float innerRadius;
  uniform float outerRadius;
  uniform float opacity;

  varying vec3 vPos;

  void main() {
    // Hitung koordinat radial (jarak dari pusat)
    float len = length(vPos.xy);
    
    // Mapping jarak ke UV (0.0 = dalam, 1.0 = luar)
    float u = (len - innerRadius) / (outerRadius - innerRadius);

    // Ambil warna dari tekstur
    vec4 color = texture2D(ringTexture, vec2(u, 0.5));

    // Haluskan pinggiran (anti-aliasing)
    float alpha = color.a * opacity;
    float edgeWidth = 0.02;
    float fade = smoothstep(0.0, edgeWidth, u) * (1.0 - smoothstep(1.0 - edgeWidth, 1.0, u));
    
    gl_FragColor = vec4(color.rgb, alpha * fade);
  }
`

function SaturnRings() {
  const innerRadius = 1.4
  const outerRadius = 2.3
  const ringMap = useTexture('/textures/saturn_ring2.jpg')
  
  const uniforms = useMemo(() => ({
    ringTexture: { value: ringMap },
    innerRadius: { value: innerRadius },
    outerRadius: { value: outerRadius },
    opacity: { value: 0.8 }
  }), [ringMap])

  return (
    <mesh rotation-x={-Math.PI / 2}>
      <ringGeometry args={[innerRadius, outerRadius, 128]} />
      <shaderMaterial
        vertexShader={ringVertexShader}
        fragmentShader={ringFragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={false} // Agar transparan cincin tidak bolong
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}

// --- 2. KOMPONEN PLANET (VOWPIXEL STYLE) ---
export const SaturnMesh = memo(function SaturnMesh() {
  const groupRef = useRef<THREE.Group>(null)
  const targetUV = useRef(new THREE.Vector2(0, 0))

  // Load Texture untuk Planet (Vowpixel)
  // Kita load saturn_map2.jpg dua kali (satu warna, satu elevasi)
  const [colorMap, bumpMap, rainbowMap] = useTexture([
    '/textures/saturn_map2.jpg', 
    '/textures/saturn_map2.jpg', 
    '/textures/04_rainbow1k.jpg'
  ])

  const uniforms = useMemo(() => ({
    size: { value: 9.5 }, 
    colorTexture: { value: colorMap },
    elevTexture: { value: bumpMap },
    rainbowTexture: { value: rainbowMap },
    uInteractive: { value: 0.0 },
    mouseUV: { value: new THREE.Vector2(0, 0) }
  }), [colorMap, bumpMap, rainbowMap])

  // Vertex Shader Planet (Logic Vowpixel / Points)
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
      
      // Elevasi (Hitam=rendah, Putih=tinggi)
      float elv = texture2D(elevTexture, vUv).r;
      vElv = elv;

      vec3 vNormal = normalMatrix * normal;
      
      // Hitung visibilitas (agar titik di belakang tidak terlihat numpuk)
      vVisible = step(0.0, dot( -normalize(mvPosition.xyz), normalize(vNormal)));
      
      // Displacement Halus
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

      // Ukuran titik (Vowpixel effect)
      // Menggunakan perspective scaling agar terlihat 3D
      gl_PointSize = size * (8.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  // Fragment Shader Planet
  const fragmentShader = `
    uniform sampler2D colorTexture;
    uniform sampler2D rainbowTexture;
    uniform float uInteractive;

    varying vec2 vUv;
    varying float vVisible;
    varying float vDist;
    varying float vElv;

    void main() {
      // Buang pixel yang tidak terlihat atau di luar lingkaran titik
      if (floor(vVisible + 0.1) == 0.0) discard;

      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      if (dot(cxy, cxy) > 1.0) discard; 

      vec3 color = texture2D(colorTexture, vUv).rgb;
      vec3 rainbowColor = texture2D(rainbowTexture, vUv).rgb;

      // Efek interaksi warna
      if (uInteractive > 0.0) {
        float thresh = 0.06;
        if (vDist < thresh) {
          color = mix(color, rainbowColor, (thresh - vDist) * 40.0 * uInteractive);
        }
      }

      // Beri sedikit shading berdasarkan elevasi
      color = color * (0.8 + 0.4 * vElv);

      gl_FragColor = vec4(color, 1.0);
    }
  `

  // Geometri Point Cloud
  const pointsGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 120), [])
  const hitboxGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 8), [])
  // Sphere untuk menutupi titik-titik bagian belakang (Occlusion)
  const occlusionGeo = useMemo(() => new THREE.IcosahedronGeometry(0.99, 64), []) 

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
    
    // Animasi lerp untuk interaksi mouse
    uniforms.mouseUV.value.lerp(targetUV.current, 0.1)
    uniforms.uInteractive.value = THREE.MathUtils.lerp(uniforms.uInteractive.value, 1.0, 0.1)
  })

  return (
    // Kemiringan Saturnus 26.7 derajat
    <group rotation-z={26.7 * (Math.PI / 180)}>
      <group ref={groupRef}>
        
        {/* --- CINCIN BARU (Design Bagus) --- */}
        <SaturnRings />

        {/* --- PLANET LAMA (Vowpixel / Points) --- */}
        
        {/* Hitbox untuk raycasting mouse */}
        <mesh 
          geometry={hitboxGeo} 
          visible={false}
          onPointerMove={(e) => {
            if (e.uv) targetUV.current.copy(e.uv)
          }}
        />

        {/* Occlusion Sphere (Warna krem gelap untuk menutupi titik belakang) */}
        <mesh geometry={occlusionGeo}>
          <meshBasicMaterial color="#c2a27e" /> 
        </mesh>

        {/* Visual Points (Vowpixel) */}
        <points 
          geometry={pointsGeo} 
          material={pointsMat} 
          raycast={() => null} 
        />
      </group>
    </group>
  )
})

// Preload Textures
useTexture.preload('/textures/saturn_map2.jpg')
useTexture.preload('/textures/saturn_ring2.jpg')
useTexture.preload('/textures/04_rainbow1k.jpg')