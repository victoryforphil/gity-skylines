import {
  Building,
  BuildingLayer,
  FileType,
  FileChangeType,
  GridCoordinate,
  BuildingUpdateResult
} from '../types/city';

/**
 * Tracks files and their building representations
 * Manages building lifecycle: creation, updates, deletion, and moves
 */
export class FileTracker {
  private buildings: Map<string, Building> = new Map(); // filePath -> Building
  private buildingIds: Map<string, string> = new Map(); // buildingId -> filePath

  /**
   * Generate unique building ID
   */
  private generateBuildingId(): string {
    return `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine file type from file path
   */
  private determineFileType(filePath: string): FileType {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return FileType.JAVASCRIPT;
      case 'ts':
      case 'tsx':
        return FileType.TYPESCRIPT;
      case 'py':
        return FileType.PYTHON;
      case 'java':
        return FileType.JAVA;
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return FileType.CSS;
      case 'html':
      case 'htm':
        return FileType.HTML;
      case 'md':
      case 'markdown':
        return FileType.MARKDOWN;
      case 'json':
        return FileType.JSON;
      case 'yml':
      case 'yaml':
      case 'toml':
      case 'ini':
      case 'conf':
      case 'config':
        return FileType.CONFIG;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return FileType.IMAGE;
      default:
        return FileType.OTHER;
    }
  }

  /**
   * Create a new building for a file
   */
  createBuilding(
    filePath: string,
    position: GridCoordinate,
    initialLayer: Omit<BuildingLayer, 'id'>
  ): BuildingUpdateResult {
    if (this.buildings.has(filePath)) {
      return {
        success: false,
        error: `Building already exists for file: ${filePath}`
      };
    }

    const buildingId = this.generateBuildingId();
    const layerId = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const building: Building = {
      id: buildingId,
      filePath,
      position,
      layers: [{
        id: layerId,
        ...initialLayer
      }],
      fileType: this.determineFileType(filePath),
      isActive: true,
      createdAt: initialLayer.timestamp,
      lastModified: initialLayer.timestamp
    };

    this.buildings.set(filePath, building);
    this.buildingIds.set(buildingId, filePath);

    return {
      success: true,
      building
    };
  }

  /**
   * Add a layer to an existing building
   */
  addLayer(
    filePath: string,
    layer: Omit<BuildingLayer, 'id'>
  ): BuildingUpdateResult {
    const building = this.buildings.get(filePath);
    
    if (!building) {
      return {
        success: false,
        error: `No building found for file: ${filePath}`
      };
    }

    if (!building.isActive) {
      return {
        success: false,
        error: `Cannot add layer to inactive building: ${filePath}`
      };
    }

    const layerId = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    building.layers.push({
      id: layerId,
      ...layer
    });
    
    building.lastModified = layer.timestamp;

    return {
      success: true,
      building
    };
  }

  /**
   * Mark a building as deleted
   */
  deleteBuilding(
    filePath: string,
    deletionLayer: Omit<BuildingLayer, 'id'>
  ): BuildingUpdateResult {
    const building = this.buildings.get(filePath);
    
    if (!building) {
      return {
        success: false,
        error: `No building found for file: ${filePath}`
      };
    }

    // Add deletion layer
    const layerId = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    building.layers.push({
      id: layerId,
      ...deletionLayer,
      changeType: FileChangeType.DELETE
    });

    building.isActive = false;
    building.lastModified = deletionLayer.timestamp;

    return {
      success: true,
      building
    };
  }

  /**
   * Move/rename a building
   */
  moveBuilding(
    oldFilePath: string,
    newFilePath: string,
    newPosition: GridCoordinate,
    moveLayer: Omit<BuildingLayer, 'id'>
  ): BuildingUpdateResult {
    const building = this.buildings.get(oldFilePath);
    
    if (!building) {
      return {
        success: false,
        error: `No building found for file: ${oldFilePath}`
      };
    }

    if (this.buildings.has(newFilePath)) {
      return {
        success: false,
        error: `Building already exists at destination: ${newFilePath}`
      };
    }

    // Add move layer
    const layerId = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    building.layers.push({
      id: layerId,
      ...moveLayer,
      changeType: FileChangeType.MOVE
    });

    // Update building properties
    building.filePath = newFilePath;
    building.position = newPosition;
    building.fileType = this.determineFileType(newFilePath);
    building.lastModified = moveLayer.timestamp;

    // Update maps
    this.buildings.delete(oldFilePath);
    this.buildings.set(newFilePath, building);
    this.buildingIds.set(building.id, newFilePath);

    return {
      success: true,
      building
    };
  }

  /**
   * Get building by file path
   */
  getBuilding(filePath: string): Building | undefined {
    return this.buildings.get(filePath);
  }

  /**
   * Get building by building ID
   */
  getBuildingById(buildingId: string): Building | undefined {
    const filePath = this.buildingIds.get(buildingId);
    return filePath ? this.buildings.get(filePath) : undefined;
  }

  /**
   * Get all active buildings
   */
  getActiveBuildings(): Building[] {
    return Array.from(this.buildings.values()).filter(building => building.isActive);
  }

  /**
   * Get all buildings (including inactive)
   */
  getAllBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  /**
   * Get buildings by file type
   */
  getBuildingsByType(fileType: FileType): Building[] {
    return Array.from(this.buildings.values()).filter(building => building.fileType === fileType);
  }

  /**
   * Get buildings modified within time range
   */
  getBuildingsModifiedInRange(startDate: Date, endDate: Date): Building[] {
    return Array.from(this.buildings.values()).filter(building => 
      building.lastModified >= startDate && building.lastModified <= endDate
    );
  }

  /**
   * Get building statistics
   */
  getStatistics() {
    const buildings = Array.from(this.buildings.values());
    const activeBuildings = buildings.filter(b => b.isActive);
    
    const fileTypeCounts: Record<FileType, number> = {} as Record<FileType, number>;
    let totalLayers = 0;
    let totalLinesAdded = 0;
    let totalLinesDeleted = 0;
    
    buildings.forEach(building => {
      fileTypeCounts[building.fileType] = (fileTypeCounts[building.fileType] || 0) + 1;
      totalLayers += building.layers.length;
      
      building.layers.forEach(layer => {
        totalLinesAdded += layer.linesAdded;
        totalLinesDeleted += layer.linesDeleted;
      });
    });

    return {
      totalBuildings: buildings.length,
      activeBuildings: activeBuildings.length,
      inactiveBuildings: buildings.length - activeBuildings.length,
      fileTypeCounts,
      totalLayers,
      totalLinesAdded,
      totalLinesDeleted,
      averageLayersPerBuilding: buildings.length > 0 ? totalLayers / buildings.length : 0
    };
  }

  /**
   * Get building history for a file
   */
  getBuildingHistory(filePath: string): BuildingLayer[] {
    const building = this.buildings.get(filePath);
    return building ? [...building.layers] : [];
  }

  /**
   * Find buildings by author
   */
  getBuildingsByAuthor(author: string): Building[] {
    return Array.from(this.buildings.values()).filter(building =>
      building.layers.some(layer => layer.author === author)
    );
  }

  /**
   * Get most active files (by number of layers)
   */
  getMostActiveFiles(limit: number = 10): Building[] {
    return Array.from(this.buildings.values())
      .sort((a, b) => b.layers.length - a.layers.length)
      .slice(0, limit);
  }

  /**
   * Get recently modified files
   */
  getRecentlyModifiedFiles(limit: number = 10): Building[] {
    return Array.from(this.buildings.values())
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      .slice(0, limit);
  }

  /**
   * Clear all buildings (for reset)
   */
  clear(): void {
    this.buildings.clear();
    this.buildingIds.clear();
  }

  /**
   * Export buildings data for persistence
   */
  exportData(): any {
    const buildings: any[] = [];
    
    for (const building of this.buildings.values()) {
      buildings.push({
        ...building,
        createdAt: building.createdAt.toISOString(),
        lastModified: building.lastModified.toISOString(),
        layers: building.layers.map(layer => ({
          ...layer,
          timestamp: layer.timestamp.toISOString()
        }))
      });
    }

    return { buildings };
  }

  /**
   * Import buildings data from persistence
   */
  importData(data: any): void {
    this.clear();
    
    if (data.buildings) {
      for (const buildingData of data.buildings) {
        const building: Building = {
          ...buildingData,
          createdAt: new Date(buildingData.createdAt),
          lastModified: new Date(buildingData.lastModified),
          layers: buildingData.layers.map((layer: any) => ({
            ...layer,
            timestamp: new Date(layer.timestamp)
          }))
        };

        this.buildings.set(building.filePath, building);
        this.buildingIds.set(building.id, building.filePath);
      }
    }
  }
}
