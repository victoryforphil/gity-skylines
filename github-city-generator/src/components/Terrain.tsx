import { useRef, useMemo } from 'react'
import { Mesh, BufferGeometry, Float32BufferAttribute } from 'three'

export function Terrain() {
  const meshRef = useRef<Mesh>(null!)

  // Create low-poly terrain with random heights
  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    const size = 50
    const segments = 32
    const vertices = []
    const indices = []

    // Create vertices with random heights
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const x = (i / segments) * size - size / 2
        const z = (j / segments) * size - size / 2
        const y = Math.random() * 2 - 1 // Random height between -1 and 1
        
        vertices.push(x, y, z)
      }
    }

    // Create faces
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j
        const b = i * (segments + 1) + j + 1
        const c = (i + 1) * (segments + 1) + j
        const d = (i + 1) * (segments + 1) + j + 1

        // Two triangles per quad
        indices.push(a, b, c)
        indices.push(b, d, c)
      }
    }

    geo.setIndex(indices)
    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geo.computeVertexNormals()

    return geo
  }, [])

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, -2, 0]}>
      <meshStandardMaterial 
        color="#4ade80" 
        wireframe={false}
        flatShading={true}
      />
    </mesh>
  )
}
