import { Building } from './Building'

export function CityGrid() {
  const buildings = []
  
  // Create a grid of buildings with random heights
  for (let x = -10; x <= 10; x += 2) {
    for (let z = -10; z <= 10; z += 2) {
      // Skip some positions to create roads
      if (x % 4 === 0 || z % 4 === 0) continue
      
      const height = Math.random() * 3 + 1
      const color = Math.random() > 0.7 ? "#f59e0b" : "#64748b"
      
      buildings.push(
        <Building
          key={`${x}-${z}`}
          position={[x, height / 2, z]}
          height={height}
          color={color}
        />
      )
    }
  }

  return <>{buildings}</>
}
