'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// --- 1. GLSL NOISE FUNCTIONS (Untuk efek plasma) ---
const noiseGLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }
`

// --- 2. Komponen: SUN GLOW (Atmosfer Luar) ---
// Ini membuat efek cahaya berpijar di sekeliling matahari
function SunGlow() {
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
      // Hitung intensitas berdasarkan sudut pandang (Fresnel)
      float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
      
      // Warna Glow (Oranye terang ke transparan)
      vec3 glowColor = vec3(1.0, 0.6, 0.2); 
      
      gl_FragColor = vec4(glowColor, 1.0) * intensity * 2.0;
    }
  `

  return (
    <mesh ref={meshRef} scale={[1.2, 1.2, 1.2]}> 
      {/* Sedikit lebih besar dari bola utama */}
      <icosahedronGeometry args={[2.5, 20]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        blending={THREE.AdditiveBlending} // Additive blending membuat cahaya terlihat 'menumpuk' dan terang
        side={THREE.BackSide} // Render bagian dalam belakang untuk efek halo
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  )
}

// --- 3. Komponen: SUN CORE (Inti Plasma) ---
function SunCore() {
  const meshRef = useRef<THREE.Mesh>(null)

  // FIX ERROR: Kita tidak perlu ref khusus untuk material.
  // Kita cukup memoize uniforms-nya saja.
  const uniforms = useMemo(() => ({
    time: { value: 0.0 },
    colorDeep: { value: new THREE.Color('#b00000') }, // Merah gelap (suhu rendah)
    colorMid: { value: new THREE.Color('#ff4500') },  // Oranye (suhu sedang)
    colorHot: { value: new THREE.Color('#ffff00') },  // Kuning (suhu tinggi)
  }), [])

  const vertexShader = `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying float vNoise;
    
    ${noiseGLSL}

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // Noise yang bergerak berdasarkan waktu
      float noise = snoise(vec3(position.x * 0.5, position.y * 0.5, position.z * 0.5 + time * 0.1));
      
      // Detail noise tambahan yang lebih cepat
      float noiseDetail = snoise(vec3(position * 2.0 + time * 0.2)) * 0.1;
      
      // Gabungkan noise
      vNoise = (noise + noiseDetail); 

      // Displacement: Menggelembungkan permukaan matahari
      vec3 newPosition = position + normal * (vNoise * 0.15);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `

  const fragmentShader = `
    uniform vec3 colorDeep;
    uniform vec3 colorMid;
    uniform vec3 colorHot;
    
    varying float vNoise;
    varying vec3 vNormal;

    void main() {
      // Normalisasi noise ke range 0.0 - 1.0
      float n = (vNoise + 1.0) * 0.5;
      
      // Membuat gradasi 3 warna berdasarkan "panas" (nilai noise)
      vec3 color;
      if (n < 0.5) {
        // Campuran Merah Gelap -> Oranye
        color = mix(colorDeep, colorMid, n * 2.0);
      } else {
        // Campuran Oranye -> Kuning Terang
        color = mix(colorMid, colorHot, (n - 0.5) * 2.0);
      }
      
      // Tambahkan efek Fresnel (pinggiran lebih terang)
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0,0,1))), 3.0);
      color += vec3(1.0, 0.8, 0.5) * fresnel * 0.5;

      gl_FragColor = vec4(color, 1.0);
    }
  `

  // Update animasi waktu
  useFrame((state) => {
    // FIX ERROR: Akses material langsung dari meshRef saat render loop
    if (meshRef.current) {
      // Casting ke ShaderMaterial agar TS tau properti uniforms ada
      const mat = meshRef.current.material as THREE.ShaderMaterial
      if (mat.uniforms) {
        mat.uniforms.time.value = state.clock.getElapsedTime()
      }
      
      // Rotasi pelan
      meshRef.current.rotation.y += 0.001
    }
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[2.5, 50]} /> 
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}

// --- 4. Export Utama ---
export function SunMesh() {
  return (
    <group>
      {/* Lampu Point Light agar Matahari menerangi planet lain di scene */}
      <pointLight intensity={2} distance={200} decay={2} color="#ffaa00" />
      
      {/* Inti Matahari */}
      <SunCore />
      
      {/* Efek Pijar Luar */}
      <SunGlow />
    </group>
  )
}