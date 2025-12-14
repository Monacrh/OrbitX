'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// Komponen Internal Atmosfer
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
      float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
      vec3 atmosphereColor = vec3(0.9, 0.6, 0.4);
      gl_FragColor = vec4(atmosphereColor, 1.0) * intensity * 1.5;
    }
  `
  return (
    <mesh ref={meshRef} scale={[1.05, 1.05, 1.05]}> 
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

// Komponen Internal Permukaan
function MarsSurface() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [colorMap, bumpMap] = useTexture([
    '/textures/mars_map.jpg', 
    '/textures/mars_bump.jpg'
  ])

  const uniforms = useMemo(() => ({
    map: { value: colorMap },
    bumpMap: { value: bumpMap },
    sunDirection: { value: new THREE.Vector3(1.0, 0.5, 1.0).normalize() }
  }), [colorMap, bumpMap])

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vElevation;
    uniform sampler2D bumpMap;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      float elevation = texture2D(bumpMap, vUv).r;
      vElevation = elevation;
      vec3 newPosition = position + normal * (elevation * 0.08);
      vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `

  const fragmentShader = `
    uniform sampler2D map;
    uniform vec3 sunDirection;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vElevation;
    void main() {
      vec3 color = texture2D(map, vUv).rgb;
      float lightIntensity = max(dot(vNormal, sunDirection), 0.05);
      lightIntensity = smoothstep(-0.2, 1.0, lightIntensity);
      float depthFactor = 1.0 - (vElevation * 0.2);
      vec3 finalColor = color * lightIntensity * depthFactor;
      finalColor = pow(finalColor, vec3(1.0/1.1));
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
  })

  return (
    <mesh ref={meshRef} rotation={[0, 0, 23.5 * (Math.PI / 180)]}> 
      <icosahedronGeometry args={[1, 128]} /> 
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}

// Export Utama: Menggabungkan keduanya
export function MarsMesh() {
  return (
    <group>
      <MarsSurface />
      <MarsAtmosphere />
    </group>
  )
}