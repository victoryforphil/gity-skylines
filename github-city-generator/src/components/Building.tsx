import { useRef } from 'react'
import { Mesh } from 'three'

interface BuildingProps {
  position: [number, number, number]
  height: number
  color?: string
}

export function Building({ position, height, color = "#64748b" }: BuildingProps) {
  const meshRef = useRef<Mesh>(null!)

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1, height, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}
