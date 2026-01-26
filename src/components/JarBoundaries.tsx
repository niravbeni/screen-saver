import { CuboidCollider } from '@react-three/rapier'

export function JarBoundaries() {
  // Narrow walls for portrait "jar" effect
  const jarWidth = 6
  const jarDepth = 6
  const jarHeight = 40
  const wallThickness = 1
  const floorY = -15

  return (
    <>
      {/* Floor */}
      <CuboidCollider
        position={[0, floorY, 0]}
        args={[jarWidth + wallThickness, wallThickness, jarDepth + wallThickness]}
        type="fixed"
      />

      {/* Left wall */}
      <CuboidCollider
        position={[-(jarWidth + wallThickness), floorY + jarHeight / 2, 0]}
        args={[wallThickness, jarHeight, jarDepth + wallThickness]}
        type="fixed"
      />

      {/* Right wall */}
      <CuboidCollider
        position={[jarWidth + wallThickness, floorY + jarHeight / 2, 0]}
        args={[wallThickness, jarHeight, jarDepth + wallThickness]}
        type="fixed"
      />

      {/* Back wall */}
      <CuboidCollider
        position={[0, floorY + jarHeight / 2, -(jarDepth + wallThickness)]}
        args={[jarWidth + wallThickness, jarHeight, wallThickness]}
        type="fixed"
      />

      {/* Front wall */}
      <CuboidCollider
        position={[0, floorY + jarHeight / 2, jarDepth + wallThickness]}
        args={[jarWidth + wallThickness, jarHeight, wallThickness]}
        type="fixed"
      />
    </>
  )
}


