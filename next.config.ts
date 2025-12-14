import type { NextConfig } from 'next'
import type { Configuration } from 'webpack'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    // @ts-expect-error - disable turbopack manually
    turbo: false, 
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  webpack: (config: Configuration) => {
    config.module?.rules?.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader', 'glslify-loader'],
    })

    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        'three/examples/jsm': 'three/examples/jsm',
      },
    }

    return config
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
}

export default nextConfig