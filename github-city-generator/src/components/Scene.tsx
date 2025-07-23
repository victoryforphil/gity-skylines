import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Grid, Stats } from '@react-three/drei'
import { EnhancedTerrain } from './EnhancedTerrain'
import { GitHubCity } from './GitHubCity'

export function Scene() {
  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [20, 15, 20], fov: 60 }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[20, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        
        {/* Environment */}
        <Environment preset="sunset" />
        
        {/* Helper grid */}
        <Grid 
          args={[50, 50]} 
          position={[0, 0.01, 0]}
          cellColor="#374151"
          sectionColor="#4b5563"
          fadeDistance={30}
          fadeStrength={1}
        />
        
        {/* Scene objects */}
        <EnhancedTerrain />
        <GitHubCity />
        
        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2.2}
        />
        
        {/* Performance stats */}
        <Stats />
      </Canvas>
    </div>
  )
}
