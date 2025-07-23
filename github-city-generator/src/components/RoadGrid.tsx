import { Road } from './Road'

export function RoadGrid() {
  const roads = []
  
  // Create horizontal roads
  for (let x = -12; x <= 12; x += 4) {
    roads.push(
      <Road
        key={`h-${x}`}
        position={[x, 0.05, 0]}
        width={1}
        length={25}
      />
    )
  }
  
  // Create vertical roads
  for (let z = -12; z <= 12; z += 4) {
    roads.push(
      <Road
        key={`v-${z}`}
        position={[0, 0.05, z]}
        rotation={[0, Math.PI / 2, 0]}
        width={1}
        length={25}
      />
    )
  }

  return <>{roads}</>
}
