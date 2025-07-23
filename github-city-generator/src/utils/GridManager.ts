import {
  GridCoordinate,
  GridCell,
  CellState,
  GridBounds,
  GridAllocationResult
} from '../types/city';

/**
 * Manages the city grid system for file positioning
 * Handles hash-based positioning, collision resolution, and grid expansion
 */
export class GridManager {
  private grid: Map<string, GridCell> = new Map();
  private bounds: GridBounds;
  private roadInterval: number;
  private readonly initialSize: number = 50;

  constructor(roadInterval: number = 4) {
    this.roadInterval = roadInterval;
    this.bounds = {
      minX: -this.initialSize / 2,
      maxX: this.initialSize / 2,
      minZ: -this.initialSize / 2,
      maxZ: this.initialSize / 2,
      width: this.initialSize,
      height: this.initialSize
    };
    this.initializeGrid();
  }

  /**
   * Initialize grid with road network
   */
  private initializeGrid(): void {
    for (let x = this.bounds.minX; x <= this.bounds.maxX; x++) {
      for (let z = this.bounds.minZ; z <= this.bounds.maxZ; z++) {
        const key = this.getGridKey(x, z);
        const isRoad = x % this.roadInterval === 0 || z % this.roadInterval === 0;
        
        this.grid.set(key, {
          coordinate: { x, z },
          state: isRoad ? CellState.ROAD : CellState.EMPTY
        });
      }
    }
  }

  /**
   * Generate grid key for coordinate
   */
  private getGridKey(x: number, z: number): string {
    return `${x},${z}`;
  }

  /**
   * Simple hash function for file paths
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get preferred grid position for a file path using hash
   */
  private getHashedPosition(filePath: string): GridCoordinate {
    const hash = this.simpleHash(filePath);
    const x = (hash % this.bounds.width) + this.bounds.minX;
    const z = Math.floor(hash / this.bounds.width) % this.bounds.height + this.bounds.minZ;
    return { x, z };
  }

  /**
   * Check if a position is valid (within bounds and not a road)
   */
  private isValidPosition(coord: GridCoordinate): boolean {
    if (coord.x < this.bounds.minX || coord.x > this.bounds.maxX ||
        coord.z < this.bounds.minZ || coord.z > this.bounds.maxZ) {
      return false;
    }

    const key = this.getGridKey(coord.x, coord.z);
    const cell = this.grid.get(key);
    return cell?.state === CellState.EMPTY;
  }

  /**
   * Find next available position using spiral search from preferred position
   */
  private findAvailablePosition(preferredPos: GridCoordinate): GridCoordinate | null {
    if (this.isValidPosition(preferredPos)) {
      return preferredPos;
    }

    // Spiral search pattern
    let radius = 1;
    const maxRadius = Math.max(this.bounds.width, this.bounds.height);

    while (radius <= maxRadius) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          // Only check perimeter of current radius
          if (Math.abs(dx) === radius || Math.abs(dz) === radius) {
            const candidate = {
              x: preferredPos.x + dx,
              z: preferredPos.z + dz
            };

            if (this.isValidPosition(candidate)) {
              return candidate;
            }
          }
        }
      }
      radius++;
    }

    return null; // No available position found
  }

  /**
   * Expand grid when no positions are available
   */
  private expandGrid(): void {
    const oldBounds = { ...this.bounds };
    const expansion = Math.ceil(Math.min(this.bounds.width, this.bounds.height) * 0.5);

    this.bounds = {
      minX: oldBounds.minX - expansion,
      maxX: oldBounds.maxX + expansion,
      minZ: oldBounds.minZ - expansion,
      maxZ: oldBounds.maxZ + expansion,
      width: oldBounds.width + (expansion * 2),
      height: oldBounds.height + (expansion * 2)
    };

    // Add new cells to expanded areas
    for (let x = this.bounds.minX; x <= this.bounds.maxX; x++) {
      for (let z = this.bounds.minZ; z <= this.bounds.maxZ; z++) {
        const key = this.getGridKey(x, z);
        
        if (!this.grid.has(key)) {
          const isRoad = x % this.roadInterval === 0 || z % this.roadInterval === 0;
          this.grid.set(key, {
            coordinate: { x, z },
            state: isRoad ? CellState.ROAD : CellState.EMPTY
          });
        }
      }
    }
  }

  /**
   * Allocate a grid position for a file
   */
  allocatePosition(filePath: string, buildingId: string): GridAllocationResult {
    const preferredPos = this.getHashedPosition(filePath);
    let availablePos = this.findAvailablePosition(preferredPos);

    // If no position found, expand grid and try again
    if (!availablePos) {
      this.expandGrid();
      availablePos = this.findAvailablePosition(preferredPos);
    }

    if (!availablePos) {
      return {
        success: false,
        error: `Unable to allocate position for file: ${filePath}`
      };
    }

    // Mark cell as occupied
    const key = this.getGridKey(availablePos.x, availablePos.z);
    const cell = this.grid.get(key);
    if (cell) {
      cell.state = CellState.OCCUPIED;
      cell.buildingId = buildingId;
    }

    return {
      success: true,
      position: availablePos
    };
  }

  /**
   * Free a grid position
   */
  freePosition(position: GridCoordinate): boolean {
    const key = this.getGridKey(position.x, position.z);
    const cell = this.grid.get(key);

    if (cell && cell.state === CellState.OCCUPIED) {
      cell.state = CellState.EMPTY;
      delete cell.buildingId;
      delete cell.reservedBy;
      return true;
    }

    return false;
  }

  /**
   * Reserve a position temporarily during operations
   */
  reservePosition(position: GridCoordinate, reservedBy: string): boolean {
    const key = this.getGridKey(position.x, position.z);
    const cell = this.grid.get(key);

    if (cell && cell.state === CellState.EMPTY) {
      cell.state = CellState.RESERVED;
      cell.reservedBy = reservedBy;
      return true;
    }

    return false;
  }

  /**
   * Release a reserved position
   */
  releaseReservation(position: GridCoordinate): boolean {
    const key = this.getGridKey(position.x, position.z);
    const cell = this.grid.get(key);

    if (cell && cell.state === CellState.RESERVED) {
      cell.state = CellState.EMPTY;
      delete cell.reservedBy;
      return true;
    }

    return false;
  }

  /**
   * Get cell at position
   */
  getCell(position: GridCoordinate): GridCell | undefined {
    const key = this.getGridKey(position.x, position.z);
    return this.grid.get(key);
  }

  /**
   * Get all occupied positions
   */
  getOccupiedPositions(): GridCoordinate[] {
    const positions: GridCoordinate[] = [];
    
    for (const cell of this.grid.values()) {
      if (cell.state === CellState.OCCUPIED) {
        positions.push(cell.coordinate);
      }
    }

    return positions;
  }

  /**
   * Get grid utilization statistics
   */
  getUtilizationStats() {
    let empty = 0;
    let occupied = 0;
    let reserved = 0;
    let roads = 0;

    for (const cell of this.grid.values()) {
      switch (cell.state) {
        case CellState.EMPTY:
          empty++;
          break;
        case CellState.OCCUPIED:
          occupied++;
          break;
        case CellState.RESERVED:
          reserved++;
          break;
        case CellState.ROAD:
          roads++;
          break;
      }
    }

    const total = empty + occupied + reserved + roads;
    const buildableTotal = empty + occupied + reserved;

    return {
      total,
      empty,
      occupied,
      reserved,
      roads,
      buildableTotal,
      utilizationPercent: buildableTotal > 0 ? (occupied / buildableTotal) * 100 : 0
    };
  }

  /**
   * Get current grid bounds
   */
  getBounds(): GridBounds {
    return { ...this.bounds };
  }

  /**
   * Get all grid cells (for debugging/visualization)
   */
  getAllCells(): Map<string, GridCell> {
    return new Map(this.grid);
  }
}
