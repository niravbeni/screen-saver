import { Suspense } from 'react'
import { Physics } from '@react-three/rapier'
import { Environment, Lightformer, Preload, ContactShadows } from '@react-three/drei'
import { JarBoundaries } from './JarBoundaries'
import { Letter, LetterPlaceholder } from './Letter'

// Configuration for each IDEO letter - staggered heights for cascade effect
const LETTERS_CONFIG = [
  { char: 'I', stlPath: '/models/letter-i.stl', startY: 20 },
  { char: 'D', stlPath: '/models/letter-d.stl', startY: 28 },
  { char: 'E', stlPath: '/models/letter-e.stl', startY: 36 },
  { char: 'O', stlPath: '/models/letter-o.stl', startY: 44 }
]

// Set to true when you have STL files, false for placeholder boxes
const USE_STL_FILES = false

export function Scene() {
  return (
    <Physics gravity={[0, -30, 0]} debug={false}>
      {/* Invisible jar boundaries */}
      <JarBoundaries />

      {/* IDEO Letters */}
      <Suspense fallback={null}>
        {USE_STL_FILES ? (
          // Use actual STL files
          LETTERS_CONFIG.map((config, index) => (
            <Letter
              key={config.char}
              stlPath={config.stlPath}
              position={[
                (Math.random() - 0.5) * 4,
                config.startY,
                (Math.random() - 0.5) * 4
              ]}
              rotation={[
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
              ]}
              scale={0.05}
              respawnY={30}
              settleTimeout={4 + index * 0.5}
            />
          ))
        ) : (
          // Use placeholder boxes for testing
          LETTERS_CONFIG.map((config, index) => (
            <LetterPlaceholder
              key={config.char}
              char={config.char}
              position={[
                (Math.random() - 0.5) * 4,
                config.startY,
                (Math.random() - 0.5) * 4
              ]}
              rotation={[
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
              ]}
              respawnY={30}
              settleTimeout={4 + index * 0.5}
            />
          ))
        )}
      </Suspense>

      {/* Environment for reflections */}
      <Environment resolution={512}>
        <group rotation={[-Math.PI / 3, 0, 0]}>
          <Lightformer
            intensity={4}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={[10, 10, 1]}
          />
          {[2, 0, 2, 0, 2, 0, 2, 0].map((x, i) => (
            <Lightformer
              key={i}
              form="circle"
              intensity={4}
              rotation={[Math.PI / 2, 0, 0]}
              position={[x, 4, i * 4]}
              scale={[4, 1, 1]}
            />
          ))}
          <Lightformer
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, 1, -1]}
            scale={[50, 2, 1]}
          />
          <Lightformer
            intensity={2}
            rotation-y={-Math.PI / 2}
            position={[10, 1, 0]}
            scale={[50, 2, 1]}
          />
        </group>
      </Environment>

      {/* Ambient and directional lights */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, 20, -10]} intensity={0.5} />

      {/* Contact shadows on the floor */}
      <ContactShadows
        position={[0, -14.9, 0]}
        opacity={0.5}
        scale={20}
        blur={2}
        far={15}
      />

      <Preload all />
    </Physics>
  )
}

