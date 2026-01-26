import { useLoader } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { useMemo } from 'react'
import type { BufferGeometry } from 'three'

export function useSTLGeometry(url: string, scale: number = 1): BufferGeometry {
  const geometry = useLoader(STLLoader, url)

  const processedGeometry = useMemo(() => {
    const geo = geometry.clone()
    geo.center()
    geo.computeVertexNormals()
    geo.scale(scale, scale, scale)
    return geo
  }, [geometry, scale])

  return processedGeometry
}

export function useMultipleSTLGeometries(
  urls: string[],
  scale: number = 1
): BufferGeometry[] {
  const geometries = useLoader(STLLoader, urls)

  const processedGeometries = useMemo(() => {
    return geometries.map((geo) => {
      const cloned = geo.clone()
      cloned.center()
      cloned.computeVertexNormals()
      cloned.scale(scale, scale, scale)
      return cloned
    })
  }, [geometries, scale])

  return processedGeometries
}


