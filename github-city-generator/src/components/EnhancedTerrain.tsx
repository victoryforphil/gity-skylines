import { useRef, useMemo } from 'react'
import { Mesh, BufferGeometry, Float32BufferAttribute } from 'three'

export function EnhancedTerrain() {
  const meshRef = useRef<Mesh>(null!)

  // Create more sophisticated low-poly terrain
  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    const size = 60
    const segments = 40
    const vertices = []
    const indices = []
    const colors = []

    // Create vertices with Perlin-like noise
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const x = (i / segments) * size - size / 2
        const z = (j / segments) * size - size / 2
        
        // Create more natural terrain with multiple octaves
        let y = 0
        y += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2
        y += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1
        y += (Math.random() - 0.5) * 0.5
        
        vertices.push(x, y, z)

        // Add colors based on height
        const normalizedHeight = (y + 3) / 6 // Normalize to 0-1
        if (normalizedHeight < 0.3) {
          colors.push(0.2, 0.4, 0.8) // Water blue
        } else if (normalizedHeight < 0.6) {
          colors.push(0.3, 0.7, 0.2) // Grass green
        } else {
          colors.push(0.6, 0.4, 0.2) // Mountain brown
        }
      }
    }

    // Create faces
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j
        const b = i * (segments + 1) + j + 1
        const c = (i + 1) * (segments + 1) + j
        const d = (i + 1) * (segments + 1) + j + 1

        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }

    geo.setIndex(indices)
    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()

    return geo
  }, [])

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, -3, 0]}>
      <meshStandardMaterial 
        vertexColors={true}
        wireframe={false}
        flatShading={true}
      />
    </mesh>
  )
}
