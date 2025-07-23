# City Transformation Design

## Core Concept

Transform GitHub repository commit history into a 3D city where:
- Each **git-tracked file** = **building**
- Each **commit affecting a file** = **layer/floor added to building**
- **File deletion** = **building removal**
- **File move/rename** = **building relocation**

## Grid System Design

### Hash-Based Positioning
```typescript
// Deterministic positioning using file path hash
function getGridPosition(filePath: string): GridCoordinate {
  const hash = simpleHash(filePath);
  const x = hash % gridWidth;
  const z = Math.floor(hash / gridWidth) % gridHeight;
  return { x, z };
}
```

### Grid Cell States
- **EMPTY**: Available for new buildings
- **OCCUPIED**: Contains a building (active file)
- **RESERVED**: Temporarily held during file operations
- **ROAD**: Designated pathway (every 4th row/column)

### Collision Resolution
When multiple files hash to the same position:
1. **Linear Probing**: Check adjacent cells in spiral pattern
2. **Overflow Areas**: Expand grid boundaries when needed
3. **Priority System**: Newer files get preference in contested areas

## Building Representation

### Building Properties
```typescript
interface Building {
  id: string;           // Unique building identifier
  filePath: string;     // Original file path
  position: GridCoordinate; // Grid position
  layers: BuildingLayer[];  // Stack of commit layers
  fileType: FileType;   // Determines building style
  isActive: boolean;    // Currently exists in repository
}

interface BuildingLayer {
  commitSha: string;    // Associated commit
  timestamp: Date;      // When layer was added
  author: string;       // Who added the layer
  changeType: 'create' | 'modify' | 'delete' | 'move';
  linesChanged: number; // Size of change
}
```

### Visual Mapping
- **Building Height**: Total number of layers (commits affecting file)
- **Layer Thickness**: Proportional to lines changed in commit
- **Building Color**: Based on file type or recent activity
- **Building Style**: Different geometries for different file types

## File Operation Handling

### File Creation
1. Hash file path to get preferred grid position
2. If position occupied, use collision resolution
3. Create new building with single layer
4. Mark grid cell as OCCUPIED

### File Modification
1. Locate existing building by file path
2. Add new layer to building stack
3. Update building height and visual properties
4. Preserve grid position

### File Deletion
1. Locate building by file path
2. Mark building as inactive
3. Add deletion layer (different visual style)
4. Free grid cell after animation
5. Mark grid cell as EMPTY

### File Move/Rename
1. Locate existing building by old file path
2. Calculate new grid position for new file path
3. If new position available:
   - Move building to new position
   - Update file path reference
   - Free old grid cell
4. If new position occupied:
   - Use collision resolution
   - May require grid expansion

## Commit Processing Pipeline

### Phase 1: Commit Analysis
```typescript
interface CommitAnalysis {
  sha: string;
  timestamp: Date;
  author: string;
  filesChanged: FileChange[];
}

interface FileChange {
  filePath: string;
  previousPath?: string; // For renames/moves
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
  linesAdded: number;
  linesDeleted: number;
}
```

### Phase 2: City State Updates
1. Process commits chronologically
2. For each file change:
   - Update or create building
   - Add layer with commit information
   - Handle grid position changes
3. Update city-wide statistics

### Phase 3: 3D Representation Generation
1. Convert buildings to Three.js geometries
2. Apply visual styling based on properties
3. Generate road network between buildings
4. Add environmental elements (terrain, lighting)

## Grid Management Strategy

### Dynamic Grid Expansion
- Start with reasonable initial size (e.g., 50x50)
- Expand in chunks when utilization > 80%
- Maintain road network during expansion
- Preserve existing building positions

### Road Network Generation
- Every 4th row and column reserved for roads
- Creates natural city blocks
- Ensures buildings are accessible
- Provides visual organization

### Performance Considerations
- Use spatial indexing for fast building lookup
- Implement LOD (Level of Detail) for large cities
- Batch geometry updates for smooth animations
- Cache hash calculations for frequently accessed files

## Implementation Notes

### Hash Function Requirements
- **Deterministic**: Same input always produces same output
- **Uniform Distribution**: Minimize clustering
- **Fast Computation**: Suitable for real-time use
- **Collision Resistant**: Reduce hash conflicts

### Memory Management
- Store only essential building data in memory
- Use lazy loading for detailed commit history
- Implement building pooling for performance
- Clean up inactive buildings after timeout

### Animation System
- Smooth building growth as layers are added
- Animated building removal on file deletion
- Building movement animations for file renames
- Temporal scrubbing to show city evolution
