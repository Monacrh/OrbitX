'use client'

import { useMemo, memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// --- 1. KOMPONEN CINCIN NEPTUNUS ---
// Cincin Neptunus ada tapi sangat tipis dan gelap
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
    float len = length(vPos.xy);
    float u = (len - innerRadius) / (outerRadius - innerRadius);
    
    vec4 color = texture2D(ringTexture, vec2(u, 0.5));

    float alpha = color.a * opacity;
    float edgeWidth = 0.05;
    float fade = smoothstep(0.0, edgeWidth, u) * (1.0 - smoothstep(1.0 - edgeWidth, 1.0, u));
    
    gl_FragColor = vec4(color.rgb, alpha * fade);
  }
`

function NeptuneRings() {
  const innerRadius = 1.5
  const outerRadius = 2.2
  
  // Gunakan tekstur cincin (bisa pakai uranus_ring sementara jika neptune_ring belum ada)
  const ringMap = useTexture('/textures/uranus_ring.jpg') 
  
  const uniforms = useMemo(() => ({
    ringTexture: { value: ringMap },
    innerRadius: { value: innerRadius },
    outerRadius: { value: outerRadius },
    opacity: { value: 0.4 } // Sangat redup
  }), [ringMap])

  return (
    // Miring sedikit (Neptunus miring sekitar 28 derajat)
    <mesh rotation-x={-Math.PI / 2}>
      <ringGeometry args={[innerRadius, outerRadius, 128]} />
      <shaderMaterial
        vertexShader={ringVertexShader}
        fragmentShader={ringFragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}

// --- 2. KOMPONEN PLANET NEPTUNUS ---
export const NeptuneMesh = memo(function NeptuneMesh() {
  const groupRef = useRef<THREE.Group>(null)
  const targetUV = useRef(new THREE.Vector2(0, 0))

  const [colorMap, bumpMap, rainbowMap] = useTexture([
    '/textures/neptune_map.jpg', 
    '/textures/neptune_map.jpg',
    '/textures/04_rainbow1k.jpg'
  ])

  const uniforms = useMemo(() => ({
    size: { value: 8.0 },
    colorTexture: { value: colorMap },
    elevTexture: { value: bumpMap },
    rainbowTexture: { value: rainbowMap },
    uInteractive: { value: 0.0 },
    mouseUV: { value: new THREE.Vector2(0, 0) }
  }), [colorMap, bumpMap, rainbowMap])

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
      
      // Badai di Neptunus cukup aktif, displacement sedikit lebih terlihat
      float displacement = elv * 0.08; 
      mvPosition.z += displacement;

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

      color = color * (0.8 + 0.3 * vElv);

      gl_FragColor = vec4(color, 1.0);
    }
  `

  const pointsGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 90), [])
  const hitboxGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 8), [])
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
    
    uniforms.mouseUV.value.lerp(targetUV.current, 0.1)
    uniforms.uInteractive.value = THREE.MathUtils.lerp(uniforms.uInteractive.value, 1.0, 0.1)
  })

  return (
    // Kemiringan Neptunus 28 derajat
    <group rotation-z={28 * (Math.PI / 180)}>
      <group ref={groupRef}>
        
        {/* Cincin */}
        <NeptuneRings />

        {/* Hitbox */}
        <mesh 
          geometry={hitboxGeo} 
          visible={false}
          onPointerMove={(e) => {
            if (e.uv) targetUV.current.copy(e.uv)
          }}
        />

        {/* Occlusion Sphere (Warna biru gelap) */}
        <mesh geometry={occlusionGeo}>
          <meshBasicMaterial color="#2d4ea3" /> 
        </mesh>

        {/* Points */}
        <points 
          geometry={pointsGeo} 
          material={pointsMat} 
          raycast={() => null} 
        />
      </group>
    </group>
  )
})