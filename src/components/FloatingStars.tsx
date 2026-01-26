import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSTLGeometry } from '../hooks/useSTLGeometry'
import type { Mesh, Group } from 'three'

const STAR_PRIMARY = '#D9FF00'
const STAR_SECONDARY = '#151F27'

interface StarProps {
  position: [number, number, number]
  color: string
  geometry: THREE.BufferGeometry
  offset: number
  scale?: number
}

function Star({ position, color, geometry, offset, scale = 0.5 }: StarProps) {
  const meshRef = useRef<Mesh>(null)
  const baseY = position[1]

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle Y-axis bobbing
      meshRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 0.8 + offset) * 0.3
      // Slow rotation
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.2 + offset
    }
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      scale={scale}
    >
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  )
}

interface FloatingStarsProps {
  count?: number
  spread?: number
  starGeometry: THREE.BufferGeometry
}

export function FloatingStars({ count = 6, spread = 2, starGeometry }: FloatingStarsProps) {
  const groupRef = useRef<Group>(null)

  // Generate random star positions and alternating colors
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        0 // Stars are parallel to the flat sides of letters (XY plane)
      ] as [number, number, number],
      color: i % 2 === 0 ? STAR_PRIMARY : STAR_SECONDARY,
      offset: Math.random() * Math.PI * 2,
      scale: 0.3 + Math.random() * 0.3
    }))
  }, [count, spread])

  return (
    <group ref={groupRef}>
      {stars.map((star) => (
        <Star
          key={star.id}
          position={star.position}
          color={star.color}
          geometry={starGeometry}
          offset={star.offset}
          scale={star.scale}
        />
      ))}
    </group>
  )
}

// Fallback floating stars component that uses a simple star shape (no STL needed for testing)
export function FloatingStarsFallback({ count = 6, spread = 2 }: { count?: number; spread?: number }) {
  const groupRef = useRef<Group>(null)

  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        0
      ] as [number, number, number],
      color: i % 2 === 0 ? STAR_PRIMARY : STAR_SECONDARY,
      offset: Math.random() * Math.PI * 2,
      scale: 0.15 + Math.random() * 0.15
    }))
  }, [count, spread])

  return (
    <group ref={groupRef}>
      {stars.map((star) => (
        <FallbackStar
          key={star.id}
          position={star.position}
          color={star.color}
          offset={star.offset}
          scale={star.scale}
        />
      ))}
    </group>
  )
}

function FallbackStar({ 
  position, 
  color, 
  offset, 
  scale = 0.5 
}: Omit<StarProps, 'geometry'>) {
  const meshRef = useRef<Mesh>(null)
  const baseY = position[1]

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 0.8 + offset) * 0.3
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.2 + offset
    }
  })

  // Create a simple 5-point star shape using a dodecahedron as placeholder
  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  )
}


