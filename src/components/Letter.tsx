import { useRef, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { MeshTransmissionMaterial, RenderTexture, Preload } from '@react-three/drei'
import { FloatingStarsFallback } from './FloatingStars'
import { useSTLGeometry } from '../hooks/useSTLGeometry'
import type { Group } from 'three'
import type { RapierRigidBody } from '@react-three/rapier'

interface LetterProps {
  stlPath: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  respawnY?: number
  settleTimeout?: number
}

export function Letter({
  stlPath,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  respawnY = 25,
  settleTimeout = 3
}: LetterProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const contentsRef = useRef<Group>(null)
  const mainRef = useRef<Group>(null)
  const settledTime = useRef(0)
  const events = useThree((state) => state.events)

  // Load STL geometry
  const geometry = useSTLGeometry(stlPath, scale)

  // Update the contents position to match the letter in world space
  useFrame((_, delta) => {
    if (contentsRef.current && mainRef.current) {
      contentsRef.current.matrix.copy(mainRef.current.matrixWorld)
    }

    // Check if letter has settled
    if (rigidBodyRef.current) {
      const vel = rigidBodyRef.current.linvel()
      const angVel = rigidBodyRef.current.angvel()
      const linearSpeed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2)
      const angularSpeed = Math.sqrt(angVel.x ** 2 + angVel.y ** 2 + angVel.z ** 2)

      if (linearSpeed < 0.5 && angularSpeed < 0.5) {
        settledTime.current += delta
        if (settledTime.current > settleTimeout) {
          // Respawn at top with random position and rotation
          const randomX = (Math.random() - 0.5) * 4
          const randomZ = (Math.random() - 0.5) * 4
          const randomRotX = Math.random() * Math.PI * 2
          const randomRotY = Math.random() * Math.PI * 2
          const randomRotZ = Math.random() * Math.PI * 2

          rigidBodyRef.current.setTranslation(
            { x: randomX, y: respawnY, z: randomZ },
            true
          )
          rigidBodyRef.current.setRotation(
            { x: randomRotX, y: randomRotY, z: randomRotZ, w: 1 },
            true
          )
          rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
          rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
          settledTime.current = 0
        }
      } else {
        settledTime.current = 0
      }
    }
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={rotation}
      restitution={0.3}
      friction={0.5}
      colliders="hull"
    >
      <group ref={mainRef}>
        <mesh geometry={geometry}>
          <MeshTransmissionMaterial
            clearcoat={1}
            samples={4}
            thickness={40}
            chromaticAberration={0.25}
            anisotropy={0.4}
            distortion={0.1}
            distortionScale={0.2}
            temporalDistortion={0.1}
            roughness={0}
          >
            <RenderTexture
              attach="buffer"
              stencilBuffer={false}
              width={512}
              height={512}
              compute={events.compute}
            >
              <color attach="background" args={['#1a3a4a']} />
              <ambientLight intensity={1} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <group ref={contentsRef} matrixAutoUpdate={false}>
                <Suspense fallback={null}>
                  <FloatingStarsFallback count={8} spread={3} />
                </Suspense>
              </group>
              <Preload all />
            </RenderTexture>
          </MeshTransmissionMaterial>
        </mesh>
      </group>
    </RigidBody>
  )
}

// Version that uses procedural geometry for testing without STL files
export function LetterPlaceholder({
  char,
  position,
  rotation = [0, 0, 0],
  respawnY = 25,
  settleTimeout = 3
}: {
  char: string
  position: [number, number, number]
  rotation?: [number, number, number]
  respawnY?: number
  settleTimeout?: number
}) {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const contentsRef = useRef<Group>(null)
  const mainRef = useRef<Group>(null)
  const settledTime = useRef(0)
  const events = useThree((state) => state.events)

  useFrame((_, delta) => {
    if (contentsRef.current && mainRef.current) {
      contentsRef.current.matrix.copy(mainRef.current.matrixWorld)
    }

    if (rigidBodyRef.current) {
      const vel = rigidBodyRef.current.linvel()
      const angVel = rigidBodyRef.current.angvel()
      const linearSpeed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2)
      const angularSpeed = Math.sqrt(angVel.x ** 2 + angVel.y ** 2 + angVel.z ** 2)

      if (linearSpeed < 0.5 && angularSpeed < 0.5) {
        settledTime.current += delta
        if (settledTime.current > settleTimeout) {
          const randomX = (Math.random() - 0.5) * 4
          const randomZ = (Math.random() - 0.5) * 4
          const randomRotX = Math.random() * Math.PI * 2
          const randomRotY = Math.random() * Math.PI * 2
          const randomRotZ = Math.random() * Math.PI * 2

          rigidBodyRef.current.setTranslation(
            { x: randomX, y: respawnY, z: randomZ },
            true
          )
          rigidBodyRef.current.setRotation(
            { x: randomRotX, y: randomRotY, z: randomRotZ, w: 1 },
            true
          )
          rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
          rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
          settledTime.current = 0
        }
      } else {
        settledTime.current = 0
      }
    }
  })

  // Use a box as placeholder - dimensions vary by letter (scaled up)
  const getBoxDimensions = (c: string): [number, number, number] => {
    switch (c) {
      case 'I':
        return [2, 6, 2]
      case 'D':
        return [4, 6, 2]
      case 'E':
        return [3.5, 6, 2]
      case 'O':
        return [5, 6, 2]
      default:
        return [3, 6, 2]
    }
  }

  const dims = getBoxDimensions(char)

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={rotation}
      restitution={0.3}
      friction={0.5}
      colliders="cuboid"
    >
      <group ref={mainRef}>
        <mesh>
          <boxGeometry args={dims} />
          <MeshTransmissionMaterial
            clearcoat={1}
            samples={4}
            thickness={40}
            chromaticAberration={0.25}
            anisotropy={0.4}
            distortion={0.1}
            distortionScale={0.2}
            temporalDistortion={0.1}
            roughness={0}
          >
            <RenderTexture
              attach="buffer"
              stencilBuffer={false}
              width={512}
              height={512}
              compute={events.compute}
            >
              <color attach="background" args={['#1a3a4a']} />
              <ambientLight intensity={1} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <group ref={contentsRef} matrixAutoUpdate={false}>
                <Suspense fallback={null}>
                  <FloatingStarsFallback count={8} spread={2} />
                </Suspense>
              </group>
              <Preload all />
            </RenderTexture>
          </MeshTransmissionMaterial>
        </mesh>
      </group>
    </RigidBody>
  )
}

