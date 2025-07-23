interface RoadProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  width: number
  length: number
}

export function Road({ position, rotation = [0, 0, 0], width, length }: RoadProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[width, 0.1, length]} />
      <meshStandardMaterial color="#374151" />
    </mesh>
  )
}
