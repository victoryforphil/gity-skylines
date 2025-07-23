# GitHub City Generator Utilities

This directory contains comprehensive utility classes for transforming GitHub repository data into 3D city visualizations. Each git-tracked file becomes a building, and each commit affecting that file adds a layer to the building.

## 🏗️ Architecture Overview

```
GitHub Commits → CommitProcessor → FileTracker → GridManager → CityGenerator → 3D City
```

### Core Components

1. **GridManager** - Manages spatial positioning of buildings in a city grid
2. **FileTracker** - Tracks file lifecycle and building representations  
3. **CommitProcessor** - Transforms GitHub API data into city-compatible format
4. **CityGenerator** - Orchestrates the entire transformation process

## 📁 Files Created

### Core Utilities
- `src/types/city.ts` - Comprehensive type definitions
- `src/utils/GridManager.ts` - Grid positioning and collision resolution
- `src/utils/FileTracker.ts` - Building lifecycle management
- `src/utils/CommitProcessor.ts` - GitHub data processing
- `src/utils/CityGeneratorCore.ts` - Core city generation functionality
- `src/utils/CityGeneratorMain.ts` - Main CityGenerator class
- `src/utils/index.ts` - Unified exports and convenience functions

### Examples & Documentation
- `src/examples/BasicUsage.tsx` - Simple usage example
- `notes/project-overview.md` - Project structure and design concepts
- `notes/city-transformation-design.md` - Detailed transformation design
- `notes/utility-classes-overview.md` - Class descriptions and features
- `notes/implementation-guide.md` - Complete implementation walkthrough

## 🚀 Quick Start

### Basic Usage

```typescript
import { CityGenerator, createCityFromGitHubRepo } from './utils';

// Method 1: Simple API
const result = await createCityFromGitHubRepo(
  'owner', 
  'repo', 
  'github-token',
  { gridSpacing: 2, layerHeight: 0.3 },
  (stage, progress, total) => console.log(`${stage}: ${progress}/${total}`)
);

// Method 2: Manual control
const cityGenerator = new CityGenerator({
  gridSpacing: 2.5,
  layerHeight: 0.25,
  maxBuildingHeight: 15
});

const cityState = await cityGenerator.generateCity(processedCommits);
const buildingGeometries = cityGenerator.generateBuildingGeometries();
```

### React Integration

```typescript
const CityVisualization = () => {
  const [cityState, setCityState] = useState(null);
  const cityGenerator = useMemo(() => new CityGenerator(), []);

  const buildingGeometries = useMemo(() => {
    return cityState ? cityGenerator.generateBuildingGeometries() : [];
  }, [cityState, cityGenerator]);

  return (
    <Canvas>
      {buildingGeometries.map((geometry, index) => (
        <Building key={index} {...geometry} />
      ))}
    </Canvas>
  );
};
```

## 🎯 Key Features

### Deterministic Positioning
- Files always appear in the same grid position
- Hash-based allocation ensures consistency
- Collision resolution with spiral search

### Building Lifecycle
- **Creation**: New files get assigned grid positions
- **Modification**: Commits add layers to buildings
- **Deletion**: Buildings are marked inactive and removed
- **Move/Rename**: Buildings relocate to new positions

### Visual Mapping
- **Building Height**: Number of commits affecting the file
- **Layer Thickness**: Proportional to lines changed
- **Building Color**: Based on file type
- **Layer Color**: Recent vs. old activity

### Performance Optimizations
- Efficient spatial indexing for fast lookups
- Batch processing for large repositories
- Memory-efficient building pooling
- Rate limiting for GitHub API calls

## 🔧 Configuration Options

```typescript
const config: CityConfig = {
  gridSpacing: 2,           // Distance between buildings
  roadWidth: 0.5,           // Width of roads
  roadInterval: 4,          // Every Nth row/column is a road
  buildingBaseSize: 1,      // Base building dimensions
  layerHeight: 0.2,         // Height of each commit layer
  maxBuildingHeight: 10,    // Cap on building height
  colorScheme: {
    fileTypes: {
      [FileType.JAVASCRIPT]: '#f7df1e',
      [FileType.TYPESCRIPT]: '#3178c6',
      // ... more file type colors
    },
    buildingBase: '#64748b',
    roads: '#374151',
    terrain: '#065f46'
  }
};
```

## 📊 Statistics & Analytics

```typescript
const stats = cityGenerator.getStatistics();
console.log({
  totalBuildings: stats.totalBuildings,
  activeBuildings: stats.activeBuildings,
  totalLayers: stats.totalLayers,
  gridUtilization: stats.gridUtilization,
  fileTypeCounts: stats.fileTypeCounts
});
```

## 🔄 Data Persistence

```typescript
// Export city state
const cityData = cityGenerator.exportCityData();
localStorage.setItem('city-state', JSON.stringify(cityData));

// Import city state
const savedData = JSON.parse(localStorage.getItem('city-state'));
cityGenerator.importCityData(savedData);
```

## 🎮 Event System

```typescript
cityGenerator.addUpdateListener((event) => {
  switch (event.type) {
    case 'building_created':
      console.log('New building:', event.buildingId);
      break;
    case 'building_updated':
      console.log('Building updated:', event.details);
      break;
    case 'building_deleted':
      console.log('Building removed:', event.buildingId);
      break;
  }
});
```

## 🛠️ Advanced Usage

### Temporal Visualization
```typescript
// Filter commits by date range
const recentCommits = commitProcessor.filterCommitsByDateRange(
  commits, 
  new Date('2024-01-01'), 
  new Date('2024-12-31')
);

// Generate city for specific time period
const historicalCity = await cityGenerator.generateCity(recentCommits);
```

### Custom File Processing
```typescript
// Add custom file change simulation
const simulatedChanges = commitProcessor.simulateFileChangesFromMessage(commit);

// Analyze commit patterns
const analysis = commitProcessor.analyzeCommitPatterns(commits);
console.log('Most active files:', analysis.mostActiveFiles);
```

### Grid Management
```typescript
// Check grid utilization
const gridStats = cityGenerator.getStatistics();
if (gridStats.gridUtilization > 80) {
  console.log('Grid is getting crowded, consider expanding');
}

// Get specific building location
const building = fileTracker.getBuilding('src/App.tsx');
console.log('Building position:', building?.position);
```

## 🔍 Debugging & Monitoring

```typescript
// Enable detailed logging
cityGenerator.addUpdateListener((event) => {
  console.log(`[${event.timestamp}] ${event.type}:`, event.details);
});

// Monitor grid state
const gridCells = gridManager.getAllCells();
const occupiedCells = Array.from(gridCells.values())
  .filter(cell => cell.state === 'occupied');
console.log(`Occupied cells: ${occupiedCells.length}`);
```

## 🚨 Error Handling

```typescript
try {
  const cityState = await cityGenerator.generateCity(commits);
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle GitHub API rate limiting
    console.log('Rate limited, retrying in 60 seconds...');
    setTimeout(() => generateCity(), 60000);
  } else {
    console.error('City generation failed:', error);
  }
}
```

## 🔮 Future Enhancements

- **Real-time Updates**: WebSocket integration for live changes
- **Multi-Repository**: Support for multiple repos as city districts  
- **Developer Visualization**: Show author contributions as building attributes
- **Metrics Integration**: Code quality and test coverage visualization
- **Animation System**: Smooth transitions for city evolution
- **LOD System**: Level-of-detail for performance with large repositories

## 🤝 Contributing

When extending these utilities:

1. **Maintain Type Safety**: All new features should be fully typed
2. **Follow Patterns**: Use existing patterns for consistency
3. **Add Tests**: Include unit tests for new functionality
4. **Update Documentation**: Keep notes and examples current
5. **Performance**: Consider memory and computational efficiency

## 📄 License

Part of the GitHub City Generator project. See main project license for terms.
