/**
 * Core types for the GitHub City Generator
 * Defines the structure for transforming git repositories into 3D cities
 */

// Grid system types
export interface GridCoordinate {
  x: number;
  z: number;
}

export interface GridCell {
  coordinate: GridCoordinate;
  state: CellState;
  buildingId?: string;
  reservedBy?: string; // Temporary reservation during operations
}

export enum CellState {
  EMPTY = 'empty',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  ROAD = 'road'
}

// Building and file types
export interface Building {
  id: string;
  filePath: string;
  position: GridCoordinate;
  layers: BuildingLayer[];
  fileType: FileType;
  isActive: boolean;
  createdAt: Date;
  lastModified: Date;
}

export interface BuildingLayer {
  id: string;
  commitSha: string;
  timestamp: Date;
  author: string;
  authorEmail: string;
  changeType: FileChangeType;
  linesAdded: number;
  linesDeleted: number;
  message: string;
}

export enum FileChangeType {
  CREATE = 'create',
  MODIFY = 'modify',
  DELETE = 'delete',
  RENAME = 'rename',
  MOVE = 'move'
}

export enum FileType {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
  CSS = 'css',
  HTML = 'html',
  MARKDOWN = 'markdown',
  JSON = 'json',
  CONFIG = 'config',
  IMAGE = 'image',
  OTHER = 'other'
}

// Commit processing types
export interface FileChange {
  filePath: string;
  previousPath?: string; // For renames/moves
  changeType: FileChangeType;
  linesAdded: number;
  linesDeleted: number;
  status: 'added' | 'modified' | 'removed' | 'renamed';
}

export interface ProcessedCommit {
  sha: string;
  timestamp: Date;
  author: string;
  authorEmail: string;
  message: string;
  filesChanged: FileChange[];
}

// City state types
export interface CityState {
  buildings: Map<string, Building>; // filePath -> Building
  grid: Map<string, GridCell>; // "x,z" -> GridCell
  gridBounds: GridBounds;
  totalCommits: number;
  totalFiles: number;
  activeFiles: number;
  lastUpdated: Date;
}

export interface GridBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  height: number;
}

// 3D representation types
export interface BuildingGeometry {
  position: [number, number, number];
  dimensions: [number, number, number]; // width, height, depth
  color: string;
  layers: LayerGeometry[];
  fileType: FileType;
}

export interface LayerGeometry {
  height: number;
  color: string;
  opacity: number;
  timestamp: Date;
  author: string;
}

// Configuration types
export interface CityConfig {
  gridSpacing: number; // Distance between grid cells
  roadWidth: number; // Width of roads
  roadInterval: number; // Every Nth row/column is a road
  buildingBaseSize: number; // Base width/depth of buildings
  layerHeight: number; // Height of each building layer
  maxBuildingHeight: number; // Cap on building height
  colorScheme: ColorScheme;
}

export interface ColorScheme {
  fileTypes: Record<FileType, string>;
  buildingBase: string;
  roads: string;
  terrain: string;
  recentActivity: string;
  oldActivity: string;
}

// Utility types for operations
export interface GridAllocationResult {
  success: boolean;
  position?: GridCoordinate;
  error?: string;
}

export interface BuildingUpdateResult {
  success: boolean;
  building?: Building;
  error?: string;
}

// Event types for city updates
export interface CityUpdateEvent {
  type: 'building_created' | 'building_updated' | 'building_deleted' | 'building_moved';
  buildingId: string;
  filePath: string;
  timestamp: Date;
  details: any;
}

// Animation types
export interface BuildingAnimation {
  buildingId: string;
  type: 'grow' | 'shrink' | 'move' | 'delete';
  duration: number;
  startTime: Date;
  endTime: Date;
  fromState: any;
  toState: any;
}
