# Utility Classes Overview

## Core Utility Classes Created

### 1. GridManager (`src/utils/GridManager.ts`)

**Purpose**: Manages the city grid system for file positioning

**Key Features**:
- Hash-based deterministic positioning for files
- Collision resolution using spiral search
- Dynamic grid expansion when needed
- Road network generation (every 4th row/column)
- Grid cell state management (EMPTY, OCCUPIED, RESERVED, ROAD)

**Key Methods**:
- `allocatePosition(filePath, buildingId)` - Assign grid position for file
- `freePosition(position)` - Release grid cell when file deleted
- `reservePosition(position, reservedBy)` - Temporarily hold position
- `getUtilizationStats()` - Grid usage statistics

### 2. FileTracker (`src/utils/FileTracker.ts`)

**Purpose**: Tracks files and their building representations throughout their lifecycle

**Key Features**:
- Building creation, modification, deletion, and moves
- Layer-based building representation (each commit = layer)
- File type detection from extensions
- Building history and statistics
- Data export/import for persistence

**Key Methods**:
- `createBuilding(filePath, position, initialLayer)` - Create new building
- `addLayer(filePath, layer)` - Add commit layer to building
- `deleteBuilding(filePath, deletionLayer)` - Mark building as deleted
- `moveBuilding(oldPath, newPath, newPosition, moveLayer)` - Handle file moves
- `getActiveBuildings()` - Get all currently active buildings

### 3. CommitProcessor (`src/utils/CommitProcessor.ts`)

**Purpose**: Processes GitHub commit data into city-compatible format

**Key Features**:
- Transform GitHub API responses into ProcessedCommit format
- Extract file changes from commit details
- Handle different file change types (CREATE, MODIFY, DELETE, RENAME, MOVE)
- Commit analysis and pattern recognition
- Rate limiting for API calls

**Key Methods**:
- `processCommits(commits)` - Convert GitHub commits to city format
- `getCommitFiles(owner, repo, commitSha, token)` - Fetch detailed file changes
- `processCommitsWithFiles()` - Full processing with file details
- `analyzeCommitPatterns()` - Extract insights from commit history

### 4. CityGenerator (`src/utils/CityGenerator.ts`)

**Purpose**: Main orchestrator that combines all utilities to generate the 3D city

**Key Features**:
- Coordinates GridManager, FileTracker, and CommitProcessor
- Processes commits chronologically to build city state
- Generates 3D building geometries for rendering
- Configurable city appearance and behavior
- Event system for city updates
- Data persistence capabilities

**Key Methods**:
- `generateCity(commits, onProgress)` - Main city generation method
- `generateBuildingGeometries()` - Create 3D representations
- `getCityState()` - Get current city state
- `reset()` - Clear city state
- `exportCityData()` / `importCityData()` - Persistence

## Type Definitions (`src/types/city.ts`)

Comprehensive type system including:
- **Grid Types**: GridCoordinate, GridCell, CellState
- **Building Types**: Building, BuildingLayer, FileType, FileChangeType
- **City Types**: CityState, CityConfig, BuildingGeometry
- **Processing Types**: ProcessedCommit, FileChange
- **Event Types**: CityUpdateEvent, BuildingAnimation

## Usage Example

```typescript
import { CityGenerator } from './utils/CityGenerator';
import { CommitProcessor } from './utils/CommitProcessor';
import { getRepositoryCommits } from './utils/github';

// 1. Fetch GitHub commits
const commits = await getRepositoryCommits('owner', 'repo', { token: 'your-token' });

// 2. Process commits with file details
const processor = new CommitProcessor();
const processedCommits = await processor.processCommitsWithFiles(
  commits, 
  'owner', 
  'repo', 
  'your-token'
);

// 3. Generate city
const cityGenerator = new CityGenerator({
  gridSpacing: 2,
  layerHeight: 0.3,
  maxBuildingHeight: 15
});

const cityState = await cityGenerator.generateCity(processedCommits, (processed, total) => {
  console.log(`Processing: ${processed}/${total}`);
});

// 4. Get 3D geometries for rendering
const buildingGeometries = cityGenerator.generateBuildingGeometries();

// 5. Use geometries in React Three Fiber components
```

## Integration with React Three Fiber

The utility classes generate `BuildingGeometry` objects that can be easily consumed by React Three Fiber components:

```typescript
// In your React component
const CityVisualization = ({ cityState }: { cityState: CityState }) => {
  const geometries = useMemo(() => 
    cityGenerator.generateBuildingGeometries(), [cityState]
  );

  return (
    <group>
      {geometries.map((geometry, index) => (
        <Building
          key={index}
          position={geometry.position}
          dimensions={geometry.dimensions}
          color={geometry.color}
          fileType={geometry.fileType}
          layers={geometry.layers}
        />
      ))}
    </group>
  );
};
```

## Performance Considerations

- **Spatial Indexing**: GridManager uses efficient coordinate-based lookups
- **Lazy Loading**: CommitProcessor can process commits incrementally
- **Memory Management**: FileTracker supports data export/import for persistence
- **Batch Updates**: CityGenerator processes commits in chronological order
- **Rate Limiting**: Built-in delays for GitHub API calls

## Extension Points

- **Custom File Types**: Extend FileType enum and add color mappings
- **Building Styles**: Customize BuildingGeometry generation
- **Grid Algorithms**: Implement alternative positioning strategies
- **Visualization Effects**: Add animations and interactions
- **Data Sources**: Adapt processors for other version control systems
