import { CodeBuilding } from './CodeBuilding'
import { RoadGrid } from './RoadGrid'

// Mock data representing a GitHub repository structure
const mockRepoData = [
  { name: 'App.tsx', type: 'component' as const, complexity: 0.8, lines: 150 },
  { name: 'UserService', type: 'class' as const, complexity: 0.9, lines: 200 },
  { name: 'utils', type: 'module' as const, complexity: 0.4, lines: 80 },
  { name: 'handleClick', type: 'function' as const, complexity: 0.3, lines: 45 },
  { name: 'Button.tsx', type: 'component' as const, complexity: 0.5, lines: 90 },
  { name: 'DatabaseManager', type: 'class' as const, complexity: 0.95, lines: 300 },
  { name: 'helpers', type: 'module' as const, complexity: 0.6, lines: 120 },
  { name: 'validateInput', type: 'function' as const, complexity: 0.7, lines: 110 },
]

export function GitHubCity() {
  const buildings = mockRepoData.map((item, index) => {
    // Position buildings in a grid pattern
    const x = (index % 4) * 3 - 4.5
    const z = Math.floor(index / 4) * 3 - 4.5
    const height = Math.max(0.5, item.lines / 50) // Height based on lines of code
    
    return (
      <CodeBuilding
        key={item.name}
        position={[x, 0, z]}
        height={height}
        buildingType={item.type}
        complexity={item.complexity}
      />
    )
  })

  return (
    <>
      <RoadGrid />
      {buildings}
    </>
  )
}
