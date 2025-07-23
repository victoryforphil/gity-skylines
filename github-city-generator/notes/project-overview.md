# GitHub City Generator - Project Overview

## Project Structure

This is a React Three.js application that visualizes GitHub repositories as 3D cities. Each file in the repository is represented as a building in a city grid.

### Technology Stack
- **React 19** - UI framework
- **Three.js** - 3D graphics library
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for React Three Fiber
- **TypeScript** - Type safety
- **Vite** - Build tool and development server
- **Tailwind CSS** - Styling

### Current Architecture

#### Core Components
- `Building.tsx` - Individual building representation (1x1x{height} box geometry)
- `CityGrid.tsx` - Static grid generator with random buildings
- `GitHubCity.tsx` - Main city visualization component
- `Scene.tsx` - Three.js scene setup

#### Data Layer
- `types/github.ts` - GitHub API type definitions
- `utils/github.ts` - GitHub API client with React hooks

#### Current Limitations
1. **Static Grid**: Current `CityGrid` generates random buildings, not based on actual repository data
2. **No File Tracking**: No system to map files to specific grid positions
3. **No Temporal Changes**: No representation of file changes over time (commits)
4. **No File Operations**: No handling of file creation, modification, deletion, or moves

## Design Concept

### City Metaphor
- **City Grid**: Repository as a city with a grid-based layout
- **Buildings**: Each git-tracked file is a building
- **Building Height**: Represents file activity/complexity
- **Building Layers**: Each commit that modifies a file adds a "layer" to the building
- **Grid Cells**: Hash-based positioning ensures consistent file placement
- **Roads**: Empty grid cells create natural pathways

### File Lifecycle
1. **Creation**: New file gets assigned to next available grid cell
2. **Modification**: Adds a layer/floor to the existing building
3. **Deletion**: Removes the building, frees the grid cell
4. **Move/Rename**: Removes old building, creates new one at different position

### Grid System Requirements
- **Deterministic Positioning**: Files should always appear in the same position
- **Hash-based Allocation**: Use file path hash to determine grid position
- **Collision Handling**: Multiple files may hash to same position
- **Growth Management**: Grid should expand as repository grows
- **Efficient Lookup**: Fast mapping between file paths and grid positions

## Implementation Plan

### Phase 1: Core Utilities
1. **GridManager** - Handle grid positioning and cell allocation
2. **FileTracker** - Map files to buildings with change history
3. **CommitProcessor** - Transform GitHub commit data into city changes
4. **CityGenerator** - Convert processed data into 3D city representation

### Phase 2: Enhanced Features
1. **Temporal Visualization** - Show city evolution over time
2. **Interactive Elements** - Click buildings to see file details
3. **Visual Enhancements** - Different building styles for file types
4. **Performance Optimization** - LOD system for large repositories

### Phase 3: Advanced Features
1. **Real-time Updates** - Live GitHub webhook integration
2. **Multiple Repositories** - City districts for different repos
3. **Developer Visualization** - Show author contributions
4. **Metrics Integration** - Code quality, test coverage as building attributes
