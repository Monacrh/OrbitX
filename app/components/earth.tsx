'use client'

import { useMemo, memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

interface EarthMeshProps {
  active: boolean
}

export const EarthMesh = memo(function EarthMesh({ active }: EarthMeshProps) {
  const globeGroupRef = useRef<THREE.Group>(null)
  const targetUV = useRef(new THREE.Vector2(0, 0))

  const colorMap = useTexture('/textures/00_earthmap1k.jpg')
  const otherMap = useTexture('/textures/04_rainbow1k.jpg')
  const elevMap = useTexture('/textures/01_earthbump1k.jpg')
  const alphaMap = useTexture('/textures/02_earthspec1k.jpg')
  
  const uniforms = useMemo(() => ({
    size: { value: 4.0 }, 
    colorTexture: { value: colorMap },
    otherTexture: { value: otherMap },
    elevTexture: { value: elevMap },
    alphaTexture: { value: alphaMap },
    mouseUV: { value: new THREE.Vector2(0.0, 0.0) },
    uInteractive: { value: 0.0 } 
  }), [colorMap, otherMap, elevMap, alphaMap])

  const vertexShader = `
    uniform float size;
    uniform sampler2D elevTexture;
    uniform vec2 mouseUV;
    uniform float uInteractive;

    varying vec2 vUv;
    varying float vVisible;
    varying float vDist;

    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      
      // Elevasi (Sama seperti versi Canvas: 0.35)
      float elv = texture2D(elevTexture, vUv).r;
      vec3 vNormal = normalMatrix * normal;
      vVisible = step(0.0, dot( -normalize(mvPosition.xyz), normalize(vNormal)));
      mvPosition.z += 0.35 * elv;

      // Interaksi Mouse (Sama seperti versi Canvas, tapi dibungkus uInteractive)
      float dist = distance(mouseUV, vUv);
      float zDisp = 0.0;
      float thresh = 0.04;
      
      // HANYA jika aktif > 0
      if (uInteractive > 0.0) {
        if (dist < thresh) {
          // Logika (thresh - dist) * 10.0 sama persis
          zDisp = (thresh - dist) * 10.0 * uInteractive;
        }
      }
      
      vDist = dist;
      mvPosition.z += zDisp;

      gl_PointSize = size;
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    uniform sampler2D colorTexture;
    uniform sampler2D alphaTexture;
    uniform sampler2D otherTexture;
    uniform float uInteractive;

    varying vec2 vUv;
    varying float vVisible;
    varying float vDist;

    void main() {
      if (floor(vVisible + 0.1) == 0.0) discard;
      
      vec3 color = texture2D(colorTexture, vUv).rgb;
      vec3 other = texture2D(otherTexture, vUv).rgb;
      
      // Logika pemisahan laut (Sama persis)
      float blue = color.b;
      float green = color.g;
      float red = color.r;
      if (blue > red && blue > green && (blue + green + red) < 1.2) {
        discard;
      }
      
      // Efek Hover (Mix warna) - Dibungkus uInteractive
      if (uInteractive > 0.0) {
        float thresh = 0.04;
        if (vDist < thresh) {
          color = mix(color, other, (thresh - vDist) * 50.0 * uInteractive);
        }
      }
      
      float alpha = 1.0 - texture2D(alphaTexture, vUv).r;
      alpha = alpha * 0.8;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
  const pointsGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 120), [])
  const oceanGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 60), [])
  
  const hitboxGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 8), [])

  const pointsMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true
  }), [uniforms, vertexShader, fragmentShader])

  const oceanTexture = useTexture('/textures/00_earthmap1k.jpg')
  const oceanMatRef = useRef<THREE.ShaderMaterial | null>(null)

  const oceanMat = useMemo(() => {
    const oceanVertexShader = `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec3 pos = position;
        float wave1 = sin(pos.x * 10.0 + time * 0.5) * 0.002;
        float wave2 = cos(pos.z * 8.0 + time * 0.7) * 0.002;
        float wave3 = sin(pos.y * 12.0 + time * 0.3) * 0.001;
        pos += normal * (wave1 + wave2 + wave3);
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `
    const oceanFragmentShader = `
      uniform sampler2D oceanTexture;
      uniform float time;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 color = texture2D(oceanTexture, vUv).rgb;
        float blue = color.b;
        float green = color.g;
        float red = color.r;
        bool isOcean = (blue > red * 1.05 && blue > green * 1.05) || ((blue + green + red) < 1.15);
        if (isOcean) {
          vec3 deepOcean = vec3(0.0, 0.1, 0.3);
          vec3 shallowOcean = vec3(0.0, 0.4, 0.7);
          vec3 baseOceanColor = mix(deepOcean, shallowOcean, blue);
          vec2 normalUV = vUv * 20.0;
          float normalWave1 = sin(normalUV.x * 3.0 + time * 0.8) * 0.5 + 0.5;
          float normalWave2 = cos(normalUV.y * 2.5 + time * 0.6) * 0.5 + 0.5;
          vec3 perturbedNormal = normalize(vNormal + vec3((normalWave1 - 0.5) * 0.1, (normalWave2 - 0.5) * 0.1, 0.0));
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - abs(dot(viewDir, perturbedNormal)), 3.0);
          vec3 fresnelColor = vec3(0.3, 0.6, 1.0);
          vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
          vec3 reflectDir = reflect(-lightDir, perturbedNormal);
          float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
          float shimmer = sin(vUv.x * 50.0 + time * 2.0) * cos(vUv.y * 50.0 + time * 1.5) * 0.1 + 0.9;
          vec3 finalColor = baseOceanColor;
          finalColor += fresnelColor * fresnel * 0.4;
          finalColor += vec3(1.0, 1.0, 1.0) * specular * 0.6;
          finalColor *= shimmer;
          float depth = 1.0 - blue * 0.3;
          finalColor *= depth;
          gl_FragColor = vec4(finalColor, 1.0);
        } else {
          discard;
        }
      }
    `
    const material = new THREE.ShaderMaterial({
      uniforms: {
        oceanTexture: { value: oceanTexture },
        time: { value: 0.0 }
      },
      vertexShader: oceanVertexShader,
      fragmentShader: oceanFragmentShader,
      transparent: true
    })
    oceanMatRef.current = material
    return material
  }, [oceanTexture])

  useFrame((state) => {
    if (globeGroupRef.current) globeGroupRef.current.rotation.y += 0.002
    
    if (oceanMatRef.current && oceanMatRef.current.uniforms.time) {
      oceanMatRef.current.uniforms.time.value = state.clock.getElapsedTime()
    }

    const targetValue = active ? 1.0 : 0.0
    uniforms.uInteractive.value = THREE.MathUtils.lerp(uniforms.uInteractive.value, targetValue, 0.1)

    if (active) {
      uniforms.mouseUV.value.lerp(targetUV.current, 0.1)
    }
  })

  return (
    <group ref={globeGroupRef}>
    
      <mesh 
        geometry={hitboxGeo} 
        visible={false} 
        onPointerMove={(e) => {
          if (active && e.uv) targetUV.current.copy(e.uv)
        }}
      />
      
      <points 
        geometry={pointsGeo} 
        material={pointsMat} 
        raycast={() => null} 
      />

      <mesh 
        geometry={oceanGeo} 
        material={oceanMat} 
        raycast={() => null} 
      />
    </group>
  )
})