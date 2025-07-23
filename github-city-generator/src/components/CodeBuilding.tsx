import { useRef } from 'react'
import { Mesh } from 'three'

interface CodeBuildingProps {
  position: [number, number, number]
  height: number
  width?: number
  depth?: number
  buildingType: 'class' | 'function' | 'module' | 'component'
  complexity: number // 0-1 scale
}

export function CodeBuilding({ 
  position, 
  height, 
  width = 1, 
  depth = 1, 
  buildingType,
  complexity 
}: CodeBuildingProps) {
  const meshRef = useRef<Mesh>(null!)

  // Color based on building type
  const getColor = () => {
    switch (buildingType) {
      case 'class': return '#3b82f6' // Blue
      case 'function': return '#10b981' // Green
      case 'module': return '#f59e0b' // Yellow
      case 'component': return '#ef4444' // Red
      default: return '#64748b' // Gray
    }
  }

  // Adjust dimensions based on complexity
  const adjustedWidth = width * (0.5 + complexity * 0.5)
  const adjustedDepth = depth * (0.5 + complexity * 0.5)
  const adjustedHeight = height * (0.3 + complexity * 0.7)

  return (
    <group position={position}>
      {/* Main building */}
      <mesh ref={meshRef} position={[0, adjustedHeight / 2, 0]}>
        <boxGeometry args={[adjustedWidth, adjustedHeight, adjustedDepth]} />
        <meshStandardMaterial 
          color={getColor()} 
          transparent
          opacity={0.8 + complexity * 0.2}
        />
      </mesh>
      
      {/* Complexity indicators (small cubes on top) */}
      {complexity > 0.7 && (
        <mesh position={[0, adjustedHeight + 0.3, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  )
}
