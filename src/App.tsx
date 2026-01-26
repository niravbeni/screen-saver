import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useControls, button, Leva } from 'leva'
import {
  Preload,
  Lightformer,
  Environment,
  MeshTransmissionMaterial,
  useGLTF,
  Center
} from '@react-three/drei'
import * as THREE from 'three'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import type { Group, Mesh, BufferGeometry } from 'three'
import type { GLTF } from 'three-stdlib'
import type { RapierRigidBody } from '@react-three/rapier'

const STAR_PRIMARY = '#D9FF00'
const LETTER_MODELS = ['/models/I.glb', '/models/D.glb', '/models/E.glb', '/models/O.glb']

useGLTF.preload('/models/I.glb')
useGLTF.preload('/models/D.glb')
useGLTF.preload('/models/E.glb')
useGLTF.preload('/models/O.glb')
useGLTF.preload('/models/star.glb')

interface LetterData {
  id: number
  modelPath: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
}

interface StarData {
  id: number
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  color: string
}

// Isometric triangular grid background
function IsometricGrid() {
  const { viewport } = useThree()
  
  const gridLines = useMemo(() => {
    const lines: number[] = []
    const size = Math.max(viewport.width, viewport.height) * 1.5
    const spacing = 2 // spacing between grid lines
    const h = spacing * Math.sqrt(3) / 2 // height of equilateral triangle
    
    // Calculate number of lines needed
    const cols = Math.ceil(size / spacing) + 10
    const rows = Math.ceil(size / h) + 10
    
    const offsetX = -size / 2
    const offsetY = -size / 2
    
    // Horizontal lines (zig-zag pattern)
    for (let row = 0; row < rows; row++) {
      const y = offsetY + row * h
      const xOffset = row % 2 === 0 ? 0 : spacing / 2
      
      // Draw diagonal lines going right-up
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * spacing + xOffset
        
        // Line going up-right
        lines.push(x, y, -10, x + spacing / 2, y + h, -10)
        // Line going up-left
        lines.push(x, y, -10, x - spacing / 2, y + h, -10)
        // Horizontal line
        if (col < cols - 1) {
          lines.push(x, y, -10, x + spacing, y, -10)
        }
      }
    }
    
    return new Float32Array(lines)
  }, [viewport])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(gridLines, 3))
    return geo
  }, [gridLines])

  return (
    <lineSegments geometry={geometry} rotation={[0, 0, Math.PI / 2]}>
      <lineBasicMaterial color="#D9D9D9" transparent opacity={0.3} />
    </lineSegments>
  )
}

export default function App() {
  const [showControls, setShowControls] = useState(false)
  
  // Toggle control panel with spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setShowControls(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const { debugMode, useExampleBackground, invertColors, portraitMode } = useControls('Mode', {
    debugMode: { value: false, label: 'Debug Single Letter' },
    useExampleBackground: { value: true, label: 'Example Blue Background' },
    invertColors: { value: false, label: 'Invert Colors (Yellow BG)' },
    portraitMode: { value: true, label: 'Portrait TV Mode (90° rotated)' },
  })

  return (
    <>
      <Leva hidden={!showControls} />
      <Canvas orthographic camera={{ position: [0, 0, 100], zoom: 40 }} dpr={[1, 1.5]}>
        <color attach="background" args={[invertColors ? STAR_PRIMARY : (useExampleBackground ? '#4899c9' : '#151F27')]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Isometric grid background */}
        <IsometricGrid />
        
        {debugMode ? (
          <DebugScene invertColors={invertColors} />
        ) : (
          <Physics gravity={portraitMode ? [-9.8, 0, 0] : [0, -9.8, 0]}>
            <Scene invertColors={invertColors} portraitMode={portraitMode} />
          </Physics>
        )}

        <Environment files="/images/Dancing Hall 1k.hdr" resolution={1024}>
          <group rotation={[-Math.PI / 3, 0, 0]}>
            <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
            {[2, 0, 2, 0, 2, 0, 2, 0].map((x, i) => (
              <Lightformer key={i} form="circle" intensity={4} rotation={[Math.PI / 2, 0, 0]} position={[x, 4, i * 4]} scale={[4, 1, 1]} />
            ))}
            <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
            <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[50, 2, 1]} />
          </group>
        </Environment>
        <Preload all />
      </Canvas>
    </>
  )
}

// Debug scene with a single static letter for testing glass material
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DebugScene({ invertColors: _invertColors }: { invertColors: boolean }) {
  const letterSettings = useControls('Letter', {
    letterScale: { value: 25, min: 5, max: 50, step: 1 },
  })

  // Glass material settings from the example - tweak these!
  const glassSettings = useControls('Glass Material', {
    clearcoat: { value: 1, min: 0, max: 1, step: 0.1 },
    samples: { value: 3, min: 1, max: 16, step: 1 },
    thickness: { value: 40, min: 1, max: 100, step: 1 },
    chromaticAberration: { value: 0.25, min: 0, max: 1, step: 0.05 },
    anisotropy: { value: 0.4, min: 0, max: 1, step: 0.05 },
    bufferColor: { value: '#4899c9' },
  })

  return <DebugLetter letterSettings={letterSettings} glassSettings={glassSettings} />
}

function DebugLetter({ 
  letterSettings,
  glassSettings
}: { 
  letterSettings: { letterScale: number }
  glassSettings: { 
    clearcoat: number
    samples: number
    thickness: number
    chromaticAberration: number
    anisotropy: number
    bufferColor: string
  }
}) {
  const { scene } = useGLTF('/models/I.glb') as GLTF & { scene: Group }

  const geometry = useMemo(() => {
    let geo: BufferGeometry | null = null
    scene.traverse(child => {
      if ((child as Mesh).isMesh && !geo) {
        geo = (child as Mesh).geometry
      }
    })
    return geo
  }, [scene])

  if (!geometry) return null

  return (
    <Center>
      <mesh geometry={geometry} scale={letterSettings.letterScale} rotation={[Math.PI / 2, 0, 0]}>
        <MeshTransmissionMaterial 
          clearcoat={glassSettings.clearcoat}
          samples={glassSettings.samples}
          thickness={glassSettings.thickness}
          chromaticAberration={glassSettings.chromaticAberration}
          anisotropy={glassSettings.anisotropy}
          transmission={1}
          roughness={0.1}
          color={glassSettings.bufferColor}
        />
      </mesh>
    </Center>
  )
}

function Scene({ invertColors, portraitMode }: { invertColors: boolean; portraitMode: boolean }) {
  const { viewport } = useThree()
  const [letters, setLetters] = useState<LetterData[]>([])
  const [stars, setStars] = useState<StarData[]>([])
  const letterIdRef = useRef(0)
  const starIdRef = useRef(0)
  const letterRefs = useRef<Map<number, RapierRigidBody>>(new Map())

  const { spawnRate, letterScale, lettersPerSpawn } = useControls('Tank', {
    spawnRate: { value: 0.8, min: 0.2, max: 3, step: 0.1 },
    lettersPerSpawn: { value: 1, min: 1, max: 3, step: 1 },
    letterScale: { value: 40, min: 25, max: 45, step: 1 },
  })
  
  // Star controls for falling stars
  const { starScale, starsPerLetter, starOpacity } = useControls('Stars', {
    starScale: { value: 12, min: 1, max: 20, step: 0.5 },
    starsPerLetter: { value: 1, min: 0, max: 3, step: 1 },
    starOpacity: { value: 1, min: 0.1, max: 1, step: 0.1 },
  })

  // Glass material settings (shared with debug mode)
  // NOTE: Lower samples = better performance but less quality
  const glassSettings = useControls('Glass Material', {
    clearcoat: { value: 0.5, min: 0, max: 1, step: 0.1 },
    samples: { value: 2, min: 1, max: 8, step: 1 },
    thickness: { value: 0.5, min: 0.1, max: 10, step: 0.1 },
    chromaticAberration: { value: 0.05, min: 0, max: 0.5, step: 0.01 },
    anisotropy: { value: 0.01, min: 0, max: 1, step: 0.05 },
    bufferColor: { value: '#ffffff' },
  })


  // Performance settings
  const { maxLetters, maxStars, performanceMode } = useControls('Performance', {
    performanceMode: { value: true, label: 'Limit Objects (smoother)' },
    maxLetters: { value: 25, min: 10, max: 150, step: 5 },
    maxStars: { value: 20, min: 10, max: 100, step: 5 },
  })

  const [resetTrigger, setResetTrigger] = useState(0)
  useControls('Actions', {
    'Reset': button(() => setResetTrigger(n => n + 1)),
  })
  
  useEffect(() => {
    if (resetTrigger === 0) return
    const timeout = setTimeout(() => {
      setLetters([])
      setStars([])
      letterRefs.current.clear()
    }, 0)
    return () => clearTimeout(timeout)
  }, [resetTrigger])

  // Spawn letters and stars
  useEffect(() => {
    const interval = setInterval(() => {
      // Spawn multiple letters at once
      const newLetters: LetterData[] = []
      for (let i = 0; i < lettersPerSpawn; i++) {
        // Portrait mode: spawn from right edge, fall left
        // Landscape mode: spawn from top, fall down
        const position: [number, number, number] = portraitMode
          ? [
              viewport.width / 2 + 3 + Math.random() * 3,  // Right edge
              (Math.random() - 0.5) * viewport.height * 0.8,  // Random Y
              (Math.random() - 0.5) * 1.5
            ]
          : [
              (Math.random() - 0.5) * viewport.width * 0.8,
              viewport.height / 2 + 3 + Math.random() * 3,
              (Math.random() - 0.5) * 1.5
            ]
        
        newLetters.push({
          id: letterIdRef.current++,
          modelPath: LETTER_MODELS[Math.floor(Math.random() * LETTER_MODELS.length)],
          position,
          rotation: [Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5],
          scale: letterScale + (Math.random() - 0.5) * 10 // Slight size variation
        })
      }
      
      setLetters(prev => {
        const updated = [...prev, ...newLetters]
        // If performance mode is on, limit the number of letters
        if (performanceMode && updated.length > maxLetters) {
          // Remove oldest letters
          const toRemove = updated.slice(0, updated.length - maxLetters)
          toRemove.forEach(l => letterRefs.current.delete(l.id))
          return updated.slice(-maxLetters)
        }
        return updated
      })

      // Spawn stars alongside the letters
      const newStars: StarData[] = []
      const totalStars = starsPerLetter * lettersPerSpawn
      for (let i = 0; i < totalStars; i++) {
        const starPosition: [number, number, number] = portraitMode
          ? [
              viewport.width / 2 + 3 + Math.random() * 4,  // Right edge
              (Math.random() - 0.5) * viewport.height * 0.9,  // Random Y
              (Math.random() - 0.5) * 2
            ]
          : [
              (Math.random() - 0.5) * viewport.width * 0.9,
              viewport.height / 2 + 3 + Math.random() * 4,
              (Math.random() - 0.5) * 2
            ]
        
        newStars.push({
          id: starIdRef.current++,
          position: starPosition,
          rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
          scale: starScale + (Math.random() - 0.5) * 4, // Slight size variation
          color: STAR_PRIMARY
        })
      }
      
      setStars(prev => {
        const updated = [...prev, ...newStars]
        // If performance mode is on, limit the number of stars
        if (performanceMode && updated.length > maxStars) {
          return updated.slice(-maxStars)
        }
        return updated
      })
    }, spawnRate * 1000)

    return () => clearInterval(interval)
  }, [spawnRate, lettersPerSpawn, letterScale, starScale, starsPerLetter, viewport, performanceMode, maxLetters, maxStars, portraitMode])

  // No auto-reset - let letters stack and fill the screen!

  const w = viewport.width / 2
  const h = viewport.height / 2
  const wallThickness = 2 // Thicker walls to prevent tunneling

  return (
    <>
      {/* Walls and floor - wrapped in fixed RigidBody to prevent tunneling */}
      <RigidBody type="fixed" colliders={false}>
        {portraitMode ? (
          <>
            {/* Portrait mode: floor on left, walls on top/bottom */}
            {/* Floor (left wall - where things pile up) */}
            <CuboidCollider position={[-w - wallThickness, 0, 0]} args={[wallThickness, h * 3, 10]} />
            {/* Right wall (spawn side - keeps things from going too far right) */}
            <CuboidCollider position={[w + wallThickness * 2, 0, 0]} args={[wallThickness, h * 3, 10]} />
            {/* Top wall */}
            <CuboidCollider position={[0, h + wallThickness, 0]} args={[w * 3, wallThickness, 10]} />
            {/* Bottom wall */}
            <CuboidCollider position={[0, -h - wallThickness, 0]} args={[w * 3, wallThickness, 10]} />
            {/* Back wall */}
            <CuboidCollider position={[0, 0, -5]} args={[w * 3, h + wallThickness, 2]} />
            {/* Front wall */}
            <CuboidCollider position={[0, 0, 5]} args={[w * 3, h + wallThickness, 2]} />
          </>
        ) : (
          <>
            {/* Landscape mode: floor on bottom, walls on sides */}
            {/* Left wall */}
            <CuboidCollider position={[-w - wallThickness, 0, 0]} args={[wallThickness, h * 3, 10]} />
            {/* Right wall */}
            <CuboidCollider position={[w + wallThickness, 0, 0]} args={[wallThickness, h * 3, 10]} />
            {/* Back wall */}
            <CuboidCollider position={[0, 0, -5]} args={[w + wallThickness, h * 3, 2]} />
            {/* Front wall */}
            <CuboidCollider position={[0, 0, 5]} args={[w + wallThickness, h * 3, 2]} />
            {/* Floor - thick floor to prevent letters falling through */}
            <CuboidCollider position={[0, -h - wallThickness, 0]} args={[w + wallThickness * 2, wallThickness, 10]} />
          </>
        )}
      </RigidBody>

      {/* Letters */}
      {letters.map(letter => (
        <Letter
          key={letter.id}
          id={letter.id}
          modelPath={letter.modelPath}
          position={letter.position}
          rotation={letter.rotation}
          scale={letter.scale}
          letterRefs={letterRefs}
          glassSettings={glassSettings}
        />
      ))}

      {/* Falling Stars */}
      {stars.map(star => (
        <FallingStar
          key={star.id}
          position={star.position}
          rotation={star.rotation}
          scale={star.scale}
          opacity={starOpacity}
          invertColors={invertColors}
        />
      ))}
    </>
  )
}

interface GlassSettings {
  clearcoat: number
  samples: number
  thickness: number
  chromaticAberration: number
  anisotropy: number
  bufferColor: string
}

interface LetterProps {
  id: number
  modelPath: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  letterRefs: React.MutableRefObject<Map<number, RapierRigidBody>>
  glassSettings: GlassSettings
}

function Letter({ id, modelPath, position, rotation, scale, letterRefs, glassSettings }: LetterProps) {
  const rigidRef = useRef<RapierRigidBody>(null)
  const { scene } = useGLTF(modelPath) as GLTF & { scene: Group }

  const geometry = useMemo(() => {
    let geo: BufferGeometry | null = null
    scene.traverse(child => {
      if ((child as Mesh).isMesh && !geo) {
        geo = (child as Mesh).geometry
      }
    })
    return geo
  }, [scene])

  useEffect(() => {
    if (rigidRef.current) {
      letterRefs.current.set(id, rigidRef.current)
    }
    const refs = letterRefs.current
    return () => { refs.delete(id) }
  }, [id, letterRefs])

  if (!geometry) return null

  return (
    <RigidBody
      ref={rigidRef}
      position={position}
      rotation={rotation}
      colliders="cuboid"
      restitution={0.2}
      friction={0.5}
    >
      <Center>
        <mesh geometry={geometry} scale={scale}>
          <MeshTransmissionMaterial 
            clearcoat={glassSettings.clearcoat}
            samples={glassSettings.samples}
            thickness={glassSettings.thickness}
            chromaticAberration={glassSettings.chromaticAberration}
            anisotropy={glassSettings.anisotropy}
            transmission={1}
            roughness={0}
            distortion={0}
            distortionScale={0}
            temporalDistortion={0}
            color={glassSettings.bufferColor}
          />
        </mesh>
      </Center>
    </RigidBody>
  )
}

const STAR_DARK = '#151F27'
const STAR_OUTLINE = '#8B8B00' // Darker yellow/olive for outline

// Falling star component
function FallingStar({ position, rotation, scale, opacity: _opacity = 1, invertColors = false }: { 
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  opacity?: number
  invertColors?: boolean
}) {
  void _opacity // Reserved for future opacity control
  const { scene } = useGLTF('/models/star.glb') as GLTF & { scene: Group }
  
  // Use dark color when inverted, otherwise use the primary yellow
  const starColor = invertColors ? STAR_DARK : STAR_PRIMARY
  const outlineColor = invertColors ? '#444444' : STAR_OUTLINE

  const { geometry, edgesGeometry } = useMemo(() => {
    let geo: BufferGeometry | null = null
    scene.traverse(child => {
      if ((child as Mesh).isMesh && !geo) {
        geo = (child as Mesh).geometry
      }
    })
    // Create edges geometry for outline
    const edges = geo ? new THREE.EdgesGeometry(geo, 15) : null
    return { geometry: geo, edgesGeometry: edges }
  }, [scene])

  if (!geometry || !edgesGeometry) return null

  return (
    <RigidBody
      position={position}
      rotation={rotation}
      colliders="cuboid"
      restitution={0.3}
      friction={0.5}
    >
      <group scale={scale}>
        {/* Main star mesh */}
        <mesh geometry={geometry}>
          <meshBasicMaterial 
            color={starColor}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
        {/* Outline */}
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial color={outlineColor} linewidth={2} />
        </lineSegments>
      </group>
    </RigidBody>
  )
}

