'use client'

import { useMemo, memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// --- 1. KOMPONEN CINCIN URANUS ---
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
    
    // Uranus rings are faint, so we darken them a bit or use texture directly
    vec4 color = texture2D(ringTexture, vec2(u, 0.5));

    float alpha = color.a * opacity;
    float edgeWidth = 0.05;
    float fade = smoothstep(0.0, edgeWidth, u) * (1.0 - smoothstep(1.0 - edgeWidth, 1.0, u));
    
    gl_FragColor = vec4(color.rgb, alpha * fade);
  }
`

function UranusRings() {
  // Cincin Uranus lebih sempit dibanding Saturnus
  const innerRadius = 1.6
  const outerRadius = 2.4
  
  // Gunakan tekstur cincin (pastikan file ini ada, atau pakai saturn_ring sementara)
  const ringMap = useTexture('/textures/uranus_ring.jpg') 
  
  const uniforms = useMemo(() => ({
    ringTexture: { value: ringMap },
    innerRadius: { value: innerRadius },
    outerRadius: { value: outerRadius },
    opacity: { value: 0.6 } // Cincin Uranus lebih redup/transparan
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
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}

// --- 2. KOMPONEN PLANET URANUS ---
export const UranusMesh = memo(function UranusMesh() {
  const groupRef = useRef<THREE.Group>(null)
  const targetUV = useRef(new THREE.Vector2(0, 0))

  // Load Textures
  // Kita asumsikan ada 'uranus_map.jpg'. Jika tidak, ganti nama filenya.
  const [colorMap, bumpMap, rainbowMap] = useTexture([
    '/textures/uranus_map.jpg', 
    '/textures/uranus_map.jpg', // Bump map pakai map yang sama
    '/textures/04_rainbow1k.jpg'
  ])

  const uniforms = useMemo(() => ({
    size: { value: 8.0 }, // Ukuran titik sedikit lebih kecil dari Saturnus
    colorTexture: { value: colorMap },
    elevTexture: { value: bumpMap },
    rainbowTexture: { value: rainbowMap },
    uInteractive: { value: 0.0 },
    mouseUV: { value: new THREE.Vector2(0, 0) }
  }), [colorMap, bumpMap, rainbowMap])

  // Shader sama persis dengan Planet lain (Vowpixel style)
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
      
      // Displacement minim karena Uranus gas giant yang halus
      float displacement = elv * 0.05; 
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
      
      // Sedikit shading
      color = color * (0.9 + 0.2 * vElv);

      gl_FragColor = vec4(color, 1.0);
    }
  `

  const pointsGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 90), []) // Sedikit lebih rendah detailnya dari Saturn
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
      // Rotasi Uranus lambat pada porosnya
      groupRef.current.rotation.y += 0.002
    }
    
    uniforms.mouseUV.value.lerp(targetUV.current, 0.1)
    uniforms.uInteractive.value = THREE.MathUtils.lerp(uniforms.uInteractive.value, 1.0, 0.1)
  })

  return (
    // URANUS TILT: Sekitar 98 derajat (Hampir tegak lurus/tidur)
    <group rotation-z={98 * (Math.PI / 180)}>
      <group ref={groupRef}>
        
        {/* Cincin Uranus */}
        <UranusRings />

        {/* Hitbox */}
        <mesh 
          geometry={hitboxGeo} 
          visible={false}
          onPointerMove={(e) => {
            if (e.uv) targetUV.current.copy(e.uv)
          }}
        />

        {/* Occlusion Sphere (Warna cyan pucat untuk dasar) */}
        <mesh geometry={occlusionGeo}>
          <meshBasicMaterial color="#a6d6e0" /> 
        </mesh>

        {/* Points Mesh */}
        <points 
          geometry={pointsGeo} 
          material={pointsMat} 
          raycast={() => null} 
        />
      </group>
    </group>
  )
})