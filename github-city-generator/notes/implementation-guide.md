# Implementation Guide

## How to Use the City Transformation Utilities

### Step 1: Basic Setup

```typescript
import { CityGenerator } from '../utils/CityGenerator';
import { CommitProcessor } from '../utils/CommitProcessor';
import { useGitHubCommits } from '../utils/github';

// In your React component
const GitHubCityViewer = ({ owner, repo, token }: Props) => {
  const [cityState, setCityState] = useState<CityState | null>(null);
  const [loading, setLoading] = useState(false);
  
  const cityGenerator = useMemo(() => new CityGenerator({
    gridSpacing: 2.5,
    layerHeight: 0.25,
    maxBuildingHeight: 12,
    roadInterval: 4
  }), []);

  // ... implementation
};
```

### Step 2: Fetch and Process Commits

```typescript
const generateCity = async () => {
  setLoading(true);
  
  try {
    // Fetch commits from GitHub
    const { commits } = useGitHubCommits(owner, repo, { 
      token, 
      per_page: 100 
    });
    
    // Process commits with detailed file information
    const processor = new CommitProcessor();
    const processedCommits = await processor.processCommitsWithFiles(
      commits,
      owner,
      repo,
      token,
      (processed, total) => {
        console.log(`Processing commits: ${processed}/${total}`);
      }
    );

    // Generate city from processed commits
    const newCityState = await cityGenerator.generateCity(
      processedCommits,
      (processed, total) => {
        console.log(`Building city: ${processed}/${total}`);
      }
    );

    setCityState(newCityState);
  } catch (error) {
    console.error('Failed to generate city:', error);
  } finally {
    setLoading(false);
  }
};
```

### Step 3: Render 3D City

```typescript
const CityVisualization = ({ cityState }: { cityState: CityState }) => {
  const buildingGeometries = useMemo(() => {
    if (!cityState) return [];
    return cityGenerator.generateBuildingGeometries();
  }, [cityState]);

  return (
    <Canvas camera={{ position: [20, 20, 20], fov: 60 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Render buildings */}
      <group>
        {buildingGeometries.map((geometry, index) => (
          <CodeBuilding
            key={`building-${index}`}
            position={geometry.position}
            dimensions={geometry.dimensions}
            color={geometry.color}
            fileType={geometry.fileType}
            layers={geometry.layers}
          />
        ))}
      </group>
      
      {/* Render roads */}
      <RoadNetwork cityState={cityState} />
      
      {/* Camera controls */}
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </Canvas>
  );
};
```

### Step 4: Create Enhanced Building Component

```typescript
const CodeBuilding = ({ position, dimensions, color, fileType, layers }: BuildingProps) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Animate building growth
  const { scale } = useSpring({
    scale: hovered ? 1.1 : 1,
    config: { tension: 300, friction: 10 }
  });

  return (
    <animated.mesh
      ref={meshRef}
      position={position}
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => {
        // Show file details
        console.log(`File: ${fileType}, Layers: ${layers.length}`);
      }}
    >
      <boxGeometry args={dimensions} />
      <meshStandardMaterial 
        color={hovered ? '#ffffff' : color}
        transparent
        opacity={0.9}
      />
      
      {/* Render individual layers */}
      {layers.map((layer, index) => (
        <LayerVisualization
          key={index}
          layer={layer}
          position={[0, (index * layer.height) - dimensions[1]/2, 0]}
        />
      ))}
    </animated.mesh>
  );
};
```

### Step 5: Add Temporal Controls

```typescript
const TemporalControls = ({ commits, onTimeChange }: TemporalProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const timeRange = useMemo(() => {
    if (commits.length === 0) return { min: 0, max: 0 };
    const times = commits.map(c => c.timestamp.getTime());
    return { min: Math.min(...times), max: Math.max(...times) };
  }, [commits]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + (24 * 60 * 60 * 1000); // 1 day
          if (next > timeRange.max) {
            setIsPlaying(false);
            return timeRange.max;
          }
          return next;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, timeRange.max]);

  useEffect(() => {
    onTimeChange(new Date(currentTime));
  }, [currentTime, onTimeChange]);

  return (
    <div className="temporal-controls">
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        min={timeRange.min}
        max={timeRange.max}
        value={currentTime}
        onChange={(e) => setCurrentTime(Number(e.target.value))}
      />
      <span>{new Date(currentTime).toLocaleDateString()}</span>
    </div>
  );
};
```

## Advanced Features

### Real-time Updates

```typescript
// Listen for city updates
cityGenerator.addUpdateListener((event: CityUpdateEvent) => {
  switch (event.type) {
    case 'building_created':
      // Animate building appearance
      animateBuildingGrowth(event.buildingId);
      break;
    case 'building_deleted':
      // Animate building disappearance
      animateBuildingDestruction(event.buildingId);
      break;
    case 'building_moved':
      // Animate building movement
      animateBuildingMove(event.buildingId, event.details);
      break;
  }
});
```

### Performance Optimization

```typescript
// Use LOD (Level of Detail) for large cities
const BuildingLOD = ({ distance, ...props }: BuildingLODProps) => {
  const detailLevel = useMemo(() => {
    if (distance < 10) return 'high';
    if (distance < 50) return 'medium';
    return 'low';
  }, [distance]);

  switch (detailLevel) {
    case 'high':
      return <DetailedBuilding {...props} />;
    case 'medium':
      return <SimpleBuilding {...props} />;
    case 'low':
      return <BasicBuilding {...props} />;
  }
};
```

### Data Persistence

```typescript
// Save city state
const saveCityState = () => {
  const cityData = cityGenerator.exportCityData();
  localStorage.setItem('github-city-state', JSON.stringify(cityData));
};

// Load city state
const loadCityState = () => {
  const savedData = localStorage.getItem('github-city-state');
  if (savedData) {
    const cityData = JSON.parse(savedData);
    cityGenerator.importCityData(cityData);
    setCityState(cityGenerator.getCityState());
  }
};
```

## Integration with Existing Components

The utilities are designed to work with the existing React Three Fiber components in the project:

1. **Building.tsx** - Enhanced to show layers and file information
2. **CityGrid.tsx** - Replaced with dynamic grid from GridManager
3. **GitHubCity.tsx** - Main component orchestrating the city generation
4. **Scene.tsx** - Handles camera, lighting, and overall 3D scene

## Error Handling

```typescript
// Robust error handling
const generateCityWithErrorHandling = async () => {
  try {
    const cityState = await cityGenerator.generateCity(commits);
    setCityState(cityState);
  } catch (error) {
    if (error.message.includes('rate limit')) {
      // Handle GitHub API rate limiting
      setTimeout(() => generateCityWithErrorHandling(), 60000);
    } else if (error.message.includes('network')) {
      // Handle network errors
      setError('Network error. Please check your connection.');
    } else {
      // Handle other errors
      setError(`Failed to generate city: ${error.message}`);
    }
  }
};
```

This implementation guide provides a complete pathway from the utility classes to a fully functional 3D GitHub city visualization.
